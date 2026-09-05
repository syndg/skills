# Agent workflows

Agent fleets live here, separate from skills. The `openai-codex` package contains portable orchestration and worker policies plus a native Synp extension. Once registered, it loads with plain `synp` and activates for a main session using `openai-codex/gpt-6-astra`. It does not patch harness source or change the main session's model or routing settings.

## Set up

Prerequisites are a compatible Synp installation, OpenAI Codex authentication, and access to the Astra, Sol, and Luna model IDs below.

Add the absolute path to this repository's `agent-workflows/openai-codex/synp` directory to the existing `extensions` array in `~/.omp/agent/config.yml`. Preserve every existing entry and all other settings. For this checkout, the new entry is:

```yaml
extensions:
  # Keep existing extension entries here.
  - /Users/syndg/skills/agent-workflows/openai-codex/synp
```

Register the package directory, not just `index.ts`. Package discovery loads the extension entry point and its sibling `agents` directory. No launcher, compatibility command, policy-path symlink, installer, or code generator is required.

Restart the main session after registration so the package loads. Then launch from the project you want to work in:

```sh
synp
```

Select `openai-codex/gpt-6-astra` through the normal model controls. The extension does not force that choice. After loading, model switches activate or deactivate orchestration on the next request without a relaunch.

Use `/fleet` to inspect the live profile state.

Synp and official OMP share `~/.omp` configuration. Registering this package also loads it in compatible official OMP installations; it is not isolated to the `synp` command. The same provider, model, and session-kind gates apply there.

## Activation and routing

The extension checks the actual request-pinned provider and model for every outgoing provider request. It injects the orchestrator policy only when the public live agent registry identifies the session as `main` and the request uses `openai-codex/gpt-6-astra`. Main sessions on Sol, Luna, or any other provider or model receive no injected fleet policy or payload changes.

For an active Astra request, the extension adds the portable policy and native role mapping to a fresh outgoing payload. It narrowly replaces the built-in scout-only research directive in outgoing instructions and tool descriptions so it does not contradict the two research roles. Tool schemas stay intact. No root model roles, disabled-agent lists, retry settings, or temporary settings overlays change, so switching away needs no settings restoration.

| Role | Responsibility | Native agent | Requested model |
| --- | --- | --- | --- |
| Astra | Intent, decomposition, consequential decisions, review and acceptance | Main session | `openai-codex/gpt-6-astra` |
| Luna | Concrete, factual exploration | `codex-explorer` | `openai-codex/gpt-5.6-luna` |
| Sol | Hypothesis-driven investigation | `codex-investigator` | `openai-codex/gpt-5.6-sol` |
| Luna | Settled, precisely specified edits | `codex-editor` | `openai-codex/gpt-5.6-luna` |
| Sol | Implementation with bounded local judgment | `codex-implementer` | `openai-codex/gpt-5.6-sol` |

Astra delegates exploration and implementation, then reviews evidence and actual changes. The four namespaced definitions bind exact provider/model IDs independently of generic model-role settings. Fleet workers are leaves. Worker startup disables child advisors through the public API; the native definitions do not request prewalk.

For native `task` calls from active Astra, both single and batch dispatch map omitted or `task` agents to `codex-implementer`, `sonic` to `codex-editor`, and `scout` to `codex-explorer`. Reasoning research explicitly selects `codex-investigator`. Explicit namespaced agents stay as selected; other specialists stay unchanged.

Eval `agent()` and `workpool()` can use the same namespaced definitions. The extension does not parse or rewrite Eval code. To cover Eval's default workers, child startup checks the live worker and parent registry entries and recognizes native `task`, `sonic`, and `scout` identities as well as the namespaced definitions. It selects the worker model through the public temporary-model API before first inference. A durable fleet-worker marker supports cold revival, but cannot turn a main branch into a worker: live session kind takes precedence.

Each fleet worker changes only its own recursion and retry settings: `maxRecursionDepth=1`, `retry.modelFallback=false`, and `retry.usageAwareFallback=false`. Its request receives the worker policy only on the matching actual Codex Sol or Luna model, never Astra's orchestrator policy. Native tasks and Eval workers retain the harness's scheduler and lifecycle.

## Files and portability

- [`openai-codex/orchestrator.md`](openai-codex/orchestrator.md) and [`openai-codex/worker.md`](openai-codex/worker.md) define portable policy without Synp syntax.
- [`openai-codex/synp/index.ts`](openai-codex/synp/index.ts) implements activation, request injection, and worker routing.
- [`openai-codex/synp/agents`](openai-codex/synp/agents) contains the four native agent definitions.

The extension resolves its real file location and reads the shared policies from the parent directory once. It injects worker policy text directly; workers do not expand a `~` path or locate a policy file themselves.

A Codex CLI adapter is next, but is not implemented. It can reuse the portable policy files, not Synp's extension hooks or native agent definitions.

## Verified locally

Checked with Synp 18.1.10:

- Plain `synp` loaded the package. `/fleet` reported active for Astra and inactive for a concurrent Sol session in the same directory.
- A live Astra → Sol → Astra switch removed and restored request policy without changing parent routing settings. Callback probes also covered inactive foreign-provider requests, unknown session identity, task-role translation, payload immutability, and idempotent injection. No alternate authenticated provider was available for a live cross-provider switch.
- Recorded assistant messages confirmed all four native worker roles, plus implicit Eval `agent()` and one-item `workpool()` dispatches: Luna handled factual research and exact editing; Sol handled investigation, implementation, and both Eval defaults.
- A separate final-request probe confirmed orchestrator policy on Astra and worker policy on Luna and Sol. Worker recursion was capped at one and model fallback disabled; parent values remained unchanged.
- The disposable editing fixture passed its behavior checks, with changes limited to the two assigned source files. No worker needed a home-directory policy pointer.

## Limits

- Requested models are not a hard billing guarantee or security boundary. Disabling worker model and usage-aware fallbacks does not disable every authentication fallback. Check actual runtime evidence rather than treating startup metadata as proof of the final model; agents should report a known mismatch.
- Worker startup routing and policy injection require the extension to load in that child. Extension-disabled or restricted children are not covered.
- The public API cannot disarm a worker's already-armed prewalk. Startup rejects that worker, reports the error, blocks work tools, and forces an error result instead of treating it as a valid fleet worker.
- Activation requires a session discoverable through the public global agent registry. Sessions using private, non-global registries remain inactive rather than being guessed to be main sessions or fleet workers.
- Read-only exploration is a tool policy, not an operating-system sandbox.
- Workers share the project checkout. Astra must assign file ownership and sequence overlapping edits; parallel execution does not isolate writes.
- The package does not configure authentication or change harness source. It uses public extension and session APIs and leaves unrelated specialists and inactive main sessions alone.
