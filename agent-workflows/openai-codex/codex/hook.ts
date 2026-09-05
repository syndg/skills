import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ASTRA = "gpt-6-astra";
const WORKERS = {
	"codex-explorer": "gpt-5.6-luna",
	"codex-investigator": "gpt-5.6-sol",
	"codex-editor": "gpt-5.6-luna",
	"codex-implementer": "gpt-5.6-sol",
} as const;
type Worker = keyof typeof WORKERS;
type JsonObject = Record<string, unknown>;
type Identity = { kind: "root" } | { kind: "worker"; role: Worker } | { kind: "unrelated" };

const ROLE_GUIDANCE: Readonly<Record<Worker, string>> = {
	"codex-explorer": "Retrieve concrete facts and report evidence without broadening the assignment.",
	"codex-investigator": "Investigate hypotheses and resolve bounded reasoning questions within the assignment.",
	"codex-editor": "Make settled, precisely specified edits and report exact evidence.",
	"codex-implementer": "Implement the bounded change, making only local decisions allowed by the assignment.",
};
const ROOT_GUIDANCE = `Codex Astra routing: this root session is fixed to ${ASTRA}. Spawn codex-explorer (${WORKERS["codex-explorer"]}) for factual retrieval, codex-investigator (${WORKERS["codex-investigator"]}) for reasoning-led investigation, codex-editor (${WORKERS["codex-editor"]}) for exact edits, and codex-implementer (${WORKERS["codex-implementer"]}) for bounded implementation. Each spawn message must be a self-contained contract with target and ownership, requirements and settled decisions, allowed local decisions and escalation conditions, acceptance criteria, and verification. Spawn workers without parent turns; they receive only that contract. These roles and models are fixed. Workers are leaves and must not create children.`;
const SINGLE_SPAWN_TOOLS: Readonly<Record<string, true>> = {
	spawn_agent: true,
	Agent: true,
	collaborationspawn_agent: true,
};
const CHILD_CREATION_TOOLS: Readonly<Record<string, true>> = {
	...SINGLE_SPAWN_TOOLS,
	spawn_agents_on_csv: true,
};

function record(value: unknown): value is JsonObject {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function workerName(value: unknown): value is Worker {
	return typeof value === "string" && Object.hasOwn(WORKERS, value);
}

function requiredString(input: JsonObject, field: string): string {
	const value = input[field];
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`expected non-empty string field ${field}`);
	}
	return value;
}

function optionalString(input: JsonObject, field: string): string | undefined {
	const value = input[field];
	if (value === undefined) return undefined;
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`expected ${field} to be a non-empty string when present`);
	}
	return value;
}

function identity(input: JsonObject): Identity {
	const agentId = optionalString(input, "agent_id");
	const agentType = optionalString(input, "agent_type");
	if (agentId === undefined && agentType === undefined) return { kind: "root" };
	if (agentId !== undefined && workerName(agentType)) return { kind: "worker", role: agentType };
	return { kind: "unrelated" };
}

function loadPolicy(name: "orchestrator" | "worker") {
	const root = dirname(dirname(realpathSync(fileURLToPath(import.meta.url))));
	const policy = readFileSync(join(root, `${name}.md`), "utf8").trim();
	if (!policy) throw new Error(`shared ${name} policy must not be empty`);
	return policy;
}

function normalizedRole(value: unknown): Worker | undefined {
	if (value === undefined || value === null) return "codex-implementer";
	if (typeof value !== "string") throw new Error("expected spawn agent_type to be a string when present");
	const role = value.trim();
	if (role === "" || role === "default" || role === "worker") return "codex-implementer";
	if (role === "explorer") return "codex-explorer";
	return workerName(role) ? role : undefined;
}

function historyFreeSpawn(toolName: string, input: JsonObject, role: Worker): JsonObject {
	const updated: JsonObject = { ...input, agent_type: role };
	// V2 requires task_name and uses fork_turns. V1 uses fork_context and defaults to no history.
	const v2 = toolName === "collaborationspawn_agent"
		|| (toolName === "spawn_agent" && (Object.hasOwn(input, "task_name") || Object.hasOwn(input, "fork_turns")));
	if (v2) {
		delete updated.fork_context;
		updated.fork_turns = "none";
	} else {
		updated.fork_context = false;
	}
	return updated;
}

function startOutput(event: "SessionStart" | "SubagentStart", additionalContext: string) {
	return {
		hookSpecificOutput: {
			hookEventName: event,
			additionalContext,
		},
	};
}

function preTool(input: JsonObject) {
	const toolName = requiredString(input, "tool_name");
	const actor = identity(input);
	if (actor.kind === "worker" && Object.hasOwn(CHILD_CREATION_TOOLS, toolName)) {
		return {
			hookSpecificOutput: {
				hookEventName: "PreToolUse",
				permissionDecision: "deny",
				permissionDecisionReason: `${actor.role} is a leaf worker and cannot create child agents. Return to Astra if the contract needs further decomposition.`,
			},
		};
	}
	if (actor.kind !== "root" || !Object.hasOwn(SINGLE_SPAWN_TOOLS, toolName)) return {};
	const toolInput = input.tool_input;
	if (!record(toolInput)) throw new Error(`expected ${toolName} tool_input to be an object`);
	const role = normalizedRole(toolInput.agent_type);
	if (!role) return {};
	return {
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "allow",
			updatedInput: historyFreeSpawn(toolName, toolInput, role),
		},
	};
}

function handle(input: JsonObject) {
	const event = requiredString(input, "hook_event_name");
	switch (event) {
		case "SessionStart": {
			const model = requiredString(input, "model");
			if (model !== ASTRA) {
				return {
					continue: false,
					stopReason: `The Astra profile requires root model ${ASTRA}; received ${model}. Start a new session with codex --profile astra.`,
				};
			}
			return startOutput("SessionStart", `${loadPolicy("orchestrator")}\n\n${ROOT_GUIDANCE}`);
		}
		case "SubagentStart": {
			requiredString(input, "agent_id");
			const role = requiredString(input, "agent_type");
			if (!workerName(role)) return {};
			const model = requiredString(input, "model");
			const context = `${loadPolicy("worker")}\n\nCodex fleet role: you are ${role}, fixed to ${WORKERS[role]}. ${ROLE_GUIDANCE[role]} The spawn message is your complete parent contract; do not rely on parent history. Do not create subagents. Return the requested result and evidence to Astra.`;
			if (model !== WORKERS[role]) {
				return startOutput(
					"SubagentStart",
					`${context}\n\nModel mismatch: this role requires ${WORKERS[role]}, but this child started as ${model}. Do not perform the task; report the mismatch to Astra.`,
				);
			}
			return startOutput("SubagentStart", context);
		}
		case "UserPromptSubmit": {
			const model = requiredString(input, "model");
			const actor = identity(input);
			if (actor.kind === "root" && model !== ASTRA) {
				return {
					decision: "block",
					reason: `The Astra profile requires root model ${ASTRA}; received ${model}. Start a new session with codex --profile astra.`,
				};
			}
			if (actor.kind === "worker" && model !== WORKERS[actor.role]) {
				return {
					decision: "block",
					reason: `${actor.role} requires model ${WORKERS[actor.role]}; received ${model}. Return this model mismatch to Astra.`,
				};
			}
			return {};
		}
		case "PreToolUse":
			return preTool(input);
		default:
			throw new Error(`unsupported hook_event_name ${event}`);
	}
}

let failedEvent: unknown;
try {
	const raw = await Bun.stdin.text();
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		throw new Error(`invalid JSON input: ${error instanceof Error ? error.message : String(error)}`);
	}
	if (!record(parsed)) throw new Error("expected hook input to be a JSON object");
	failedEvent = parsed.hook_event_name;
	const output = handle(parsed);
	process.stdout.write(`${JSON.stringify(output)}\n`);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`Astra Codex hook failed: ${message}\n`);
	process.exitCode = failedEvent === "PreToolUse" ? 2 : 1;
}
