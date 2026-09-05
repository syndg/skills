import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AgentRegistry, type AgentRef, type ExtensionAPI, type ExtensionContext } from "@oh-my-pi/pi-coding-agent";

const PROVIDER = "openai-codex";
const ASTRA = "gpt-6-astra";
const MARKER = "openai-codex-fleet-worker-v1";
const START = "<!-- openai-codex-fleet:v1 -->";
const END = "<!-- /openai-codex-fleet:v1 -->";
const WORKERS = {
	"codex-explorer": "gpt-5.6-luna",
	"codex-investigator": "gpt-5.6-sol",
	"codex-editor": "gpt-5.6-luna",
	"codex-implementer": "gpt-5.6-sol",
} as const;
type Worker = keyof typeof WORKERS;
type ModelIdentity = { provider: string; id: string } | undefined;

const ALIASES: Readonly<Record<string, Worker>> = {
	task: "codex-implementer",
	sonic: "codex-editor",
	scout: "codex-explorer",
};
const MAPPING = `Synp fleet routing: use codex-explorer for factual Luna research, codex-investigator for reasoning-led Sol research, codex-editor for exact Luna edits, and codex-implementer for bounded Sol implementation. These native definitions bind the worker models. Use these names in task, Eval agent(), and workpool(); omitted/default task uses codex-implementer. Do not request generic scout for reasoning research. Astra owns review; do not delegate review to another Astra or an advisor. Workers are leaves. Do not enable prewalk or advisors.`;
const SCOUT_ONLY = "Read-only research MUST run on `scout` (faster model).";
const SCOUT_DESCRIPTION = "MUST be used for exploratory codebase research, rapid code analysis, and broad pattern searches.";
const FLEET_RESEARCH = "Read-only research MUST use `codex-explorer` for factual retrieval or `codex-investigator` for reasoning-led investigation.";

// Shared across the loader's fresh per-session factories, keyed by registry generation.
const registeredUnderFleet = new WeakMap<AgentRef, boolean>();
let policies: { orchestrator: string; worker: string } | undefined;
function loadPolicies() {
	if (!policies) {
		const root = dirname(dirname(realpathSync(fileURLToPath(import.meta.url))));
		const orchestrator = readFileSync(join(root, "orchestrator.md"), "utf8").trim();
		const worker = readFileSync(join(root, "worker.md"), "utf8").trim();
		if (!orchestrator || !worker) throw new Error("Codex fleet: shared policies must not be empty.");
		policies = { orchestrator, worker };
	}
	return policies;
}

function record(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function workerName(value: unknown): value is Worker {
	return typeof value === "string" && Object.hasOwn(WORKERS, value);
}
function matches(model: ModelIdentity, id: string) {
	return model?.provider === PROVIDER && model.id === id;
}
function activeMain(ref: AgentRef | undefined, model: ModelIdentity) {
	return ref?.kind === "main" && matches(model, ASTRA);
}
function rewriteTask(input: Record<string, unknown>): Record<string, unknown> {
	if (Array.isArray(input.tasks)) {
		let changed = false;
		const tasks = input.tasks.map(item => {
			if (!record(item)) return item;
			const next = rewriteTask(item);
			changed ||= next !== item;
			return next;
		});
		return changed ? { ...input, tasks } : input;
	}
	const agent = input.agent === undefined ? "codex-implementer" :
		typeof input.agent === "string" && Object.hasOwn(ALIASES, input.agent) ? ALIASES[input.agent] : undefined;
	return agent ? { ...input, agent } : input;
}

// Only provider tool containers are traversed. JSON Schema descriptions are not instructions.
function rewriteTool(tool: unknown): unknown {
	if (!record(tool)) return tool;
	let result = tool;
	if (typeof tool.description === "string") {
		const description = tool.description.replaceAll(SCOUT_ONLY, FLEET_RESEARCH).replaceAll(SCOUT_DESCRIPTION, FLEET_RESEARCH);
		if (description !== tool.description) result = { ...result, description };
	}
	if (record(tool.function)) {
		const fn = rewriteTool(tool.function);
		if (fn !== tool.function) result = { ...result, function: fn };
	}
	if (Array.isArray(tool.tools)) {
		const tools = rewriteTools(tool.tools);
		if (tools !== tool.tools) result = { ...result, tools };
	}
	return result;
}
function rewriteTools(tools: unknown[]) {
	let changed = false;
	const result = tools.map(tool => {
		const next = rewriteTool(tool);
		changed ||= next !== tool;
		return next;
	});
	return changed ? result : tools;
}
function inject(payload: unknown, policy: string, orchestrator: boolean) {
	if (!record(payload) || (payload.instructions !== undefined && typeof payload.instructions !== "string")) {
		throw new Error("Codex fleet: expected a Responses payload with string instructions.");
	}
	let instructions = (payload.instructions as string | undefined) ?? "";
	// Replace our own block when a transport retries an already prepared payload.
	const start = instructions.indexOf(START);
	if (start !== -1) {
		const end = instructions.indexOf(END, start + START.length);
		if (end === -1) throw new Error("Codex fleet: incomplete instruction block.");
		const boundary = start >= 2 && instructions.slice(start - 2, start) === "\n\n" ? start - 2 : start;
		instructions = instructions.slice(0, boundary) + instructions.slice(end + END.length);
	}
	if (orchestrator) instructions = instructions.replaceAll(SCOUT_ONLY, FLEET_RESEARCH).replaceAll(SCOUT_DESCRIPTION, FLEET_RESEARCH);
	const result = { ...payload, instructions: `${instructions}\n\n${START}\n${policy}\n${END}` };
	if (orchestrator && Array.isArray(payload.tools)) {
		const tools = rewriteTools(payload.tools);
		if (tools !== payload.tools) return { ...result, tools };
	}
	return result;
}

export default function codexFleet(pi: ExtensionAPI) {
	const registry = AgentRegistry.global();
	let cachedRef: AgentRef | undefined;
	let releaseRegistry: (() => void) | undefined;
	let worker: { manager: ExtensionContext["sessionManager"]; sessionId: string; role: Worker; error?: Error } | undefined;

	function identity(ctx: ExtensionContext) {
		if (cachedRef && registry.get(cachedRef.id) === cachedRef && cachedRef.session?.sessionManager === ctx.sessionManager) {
			return cachedRef;
		}
		cachedRef = registry.list().find(ref => ref.session?.sessionManager === ctx.sessionManager);
		return cachedRef;
	}
	function workerState(ctx: ExtensionContext) {
		return worker?.manager === ctx.sessionManager && worker.sessionId === ctx.sessionManager.getSessionId() ? worker : undefined;
	}
	async function start(_event: unknown, ctx: ExtensionContext) {
		releaseRegistry?.();
		releaseRegistry = undefined;
		worker = undefined;
		const ref = identity(ctx);
		if (!ref?.session) return;
		if (ref.kind === "main") {
			// Snapshot each registered child, not a process-wide active flag. Queued children
			// keep their launch policy if the parent changes model during child startup.
			releaseRegistry = registry.onChange(event => {
				if (event.type === "registered" && event.ref.kind === "sub" && event.ref.parentId === ref.id && registry.get(ref.id) === ref) {
					registeredUnderFleet.set(event.ref, activeMain(ref, ref.session?.model));
				}
			});
			return;
		}
		if (ref.kind !== "sub") return;
		let role: Worker | undefined;
		let definition = ref.history?.agent;
		let marked = false;
		for (const entry of ctx.sessionManager.getBranch()) {
			if (entry.type === "session_init" && entry.agent) definition = entry.agent;
			if (entry.type === "custom" && entry.customType === MARKER && record(entry.data) && workerName(entry.data.role)) {
				role = entry.data.role;
				marked = true;
			}
		}
		const parent = ref.parentId ? registry.get(ref.parentId) : undefined;
		const launchedActive = registeredUnderFleet.get(ref) ?? activeMain(parent, parent?.session?.model);
		if (!marked && !launchedActive) return;
		role ??= workerName(definition) ? definition : definition && Object.hasOwn(ALIASES, definition) ? ALIASES[definition] : undefined;
		if (!role) return;
		const state = { manager: ctx.sessionManager, sessionId: ctx.sessionManager.getSessionId(), role, error: undefined as Error | undefined };
		worker = state;
		try {
			if (!marked) pi.appendEntry(MARKER, { role, parentId: ref.parentId });
			loadPolicies();
			if (parent?.session?.settings === ref.session.settings) throw new Error("Codex fleet: child settings are not isolated from its parent.");
			ref.session.settings.override("task.maxRecursionDepth", 1);
			ref.session.settings.override("retry.modelFallback", false);
			ref.session.settings.override("retry.usageAwareFallback", false);
			ref.session.setAdvisorEnabled(false);
			if (ref.session.getPrewalkState()) throw new Error("Codex fleet: worker has prewalk armed. Disable its prewalk configuration and launch it again.");
			let model = ctx.modelRegistry.find(PROVIDER, WORKERS[role]);
			if (!matches(model, WORKERS[role])) {
				await ctx.modelRegistry.awaitBackgroundRefresh();
				model = ctx.modelRegistry.find(PROVIDER, WORKERS[role]);
			}
			if (!model || !matches(model, WORKERS[role])) throw new Error(`Codex fleet: exact model ${PROVIDER}/${WORKERS[role]} is unavailable.`);
			if (identity(ctx) !== ref || ref.kind !== "sub" || workerState(ctx) !== state) {
				throw new Error("Codex fleet: worker identity changed during model initialization.");
			}
			await ref.session.setModelTemporary(model);
			if (!matches(ref.session.model, WORKERS[role])) throw new Error("Codex fleet: temporary model switch did not select the requested worker model.");
		} catch (error) {
			state.error = error instanceof Error ? error : new Error(String(error));
			pi.sendMessage({ customType: "openai-codex-fleet-error", content: `${state.error.message}\nReturn this failure with yield; do not continue the assignment.`, display: true });
			throw state.error;
		}
	}

	pi.on("session_start", start);
	pi.on("session_switch", start);
	pi.on("session_shutdown", () => { releaseRegistry?.(); releaseRegistry = undefined; });
	pi.on("before_provider_request", (event, ctx) => {
		const ref = identity(ctx);
		if (activeMain(ref, ctx.model)) return inject(event.payload, `${loadPolicies().orchestrator}\n\n${MAPPING}`, true);
		if (ref?.kind === "sub") {
			const state = workerState(ctx);
			if (state?.error) throw state.error;
			if (state && matches(ctx.model, WORKERS[state.role])) return inject(event.payload, loadPolicies().worker, false);
		}
		return event.payload;
	});
	pi.on("tool_call", (event, ctx) => {
		if (identity(ctx)?.kind === "sub") {
			const failure = workerState(ctx)?.error;
			if (failure) return event.toolName === "yield" ? { input: { error: failure.message } } : { block: true, reason: failure.message };
		}
		if (event.toolName !== "task" || !activeMain(identity(ctx), ctx.model)) return;
		const input = rewriteTask(event.input);
		if (input !== event.input) return { input };
	});
	pi.registerCommand("fleet", {
		description: "Show automatic Codex fleet activation for this session",
		handler: async (_args, ctx) => {
			const ref = identity(ctx);
			const state = ref?.kind === "sub" ? workerState(ctx) : undefined;
			let status = "Codex fleet inactive. Requires a registered main session on openai-codex/gpt-6-astra.";
			if (activeMain(ref, ctx.model)) {
				loadPolicies();
				status = "Codex fleet active: Astra orchestrates; Luna and Sol handle leaf assignments.";
			} else if (state) {
				status = state.error ? `Codex fleet failed: ${state.error.message}` :
					`Codex fleet worker ${state.role}; actual model ${ctx.model?.provider}/${ctx.model?.id}; worker policy ${matches(ctx.model, WORKERS[state.role]) ? "active" : "inactive"}.`;
			}
			ctx.ui.notify(status, state?.error ? "error" : "info");
		},
	});
}
