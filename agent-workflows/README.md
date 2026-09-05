# Agent workflows

Agent fleets live here, separate from skills. The `openai-codex` package contains shared orchestration and worker policies, an automatically activated Synp extension, and an explicit Codex CLI Astra profile. Synp activates its extension after registration; Codex CLI uses the profile only when you launch `codex --profile astra`. Neither path patches harness source.

## Synp setup

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

## Synp activation and routing

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

## Codex CLI profile

The Codex CLI adapter is explicit and fixed to an Astra root session. The profile sets `model_provider = "openai"` and `model = "gpt-6-astra"`. `codex --profile astra` selects that profile, while `cxa` is a short alias for the same command. Plain `codex` keeps its normal defaults and does not load this profile.

Synp and Codex use different model-ID forms. Synp's model controls use IDs such as `openai-codex/gpt-6-astra`; the Codex profile and its role files use bare IDs such as `gpt-6-astra`, `gpt-5.6-luna`, and `gpt-5.6-sol`. Do not put the `openai-codex/` prefix in Codex CLI profile values or commands.

The profile registers exactly four native worker roles:

| Role | Responsibility | Model |
| --- | --- | --- |
| `codex-explorer` | Concrete, factual exploration | `gpt-5.6-luna` |
| `codex-investigator` | Hypothesis-driven investigation | `gpt-5.6-sol` |
| `codex-editor` | Settled, precisely specified edits | `gpt-5.6-luna` |
| `codex-implementer` | Implementation with bounded local judgment | `gpt-5.6-sol` |

These registrations are declared inside `astra.config.toml` with per-role `config_file` entries. Each value uses `agent-workflows/openai-codex/codex/agents/<name>.toml`, relative to the `CODEX_HOME` profile folder. They are profile-scoped, not global `~/.codex/agents` registrations, so plain Codex sessions remain unchanged. The profile reuses the portable [`orchestrator.md`](openai-codex/orchestrator.md) and [`worker.md`](openai-codex/worker.md) policies.

Native subagent dispatch is history-free. The hooks route the root's default, `worker`, or omitted spawn role to `codex-implementer`, route `explorer` to `codex-explorer`, and preserve explicit names from the four-role set. They recognize the installed V1 and V2 child-creation names `spawn_agent`, `Agent`, and `collaborationspawn_agent`; `spawn_agents_on_csv` is also treated as child creation. Unrelated role names stay unchanged. V2 root fleet spawns set `fork_turns=none`; V1 uses `fork_context=false`. Fleet workers do not create children.

The profile hook runs:

```sh
bun "${CODEX_HOME:-$HOME/.codex}/agent-workflows/openai-codex/codex/hook.ts"
```

`SessionStart` adds the shared orchestrator policy and Codex-native routing guidance to the Astra root. `SubagentStart` adds the shared worker policy to the four roles, whose startup validates the selected worker model independently. `UserPromptSubmit` rejects use of this fixed-Astra profile from a non-Astra root. `PreToolUse` applies the spawn routing and worker child-creation guardrails.

Codex must trust and approve this hook source before it runs. That approval is explicit. The profile and `cxa` never add `--dangerously-bypass-hook-trust`.

For this checkout, local setup uses:

- `~/.codex/astra.config.toml` -> a local copy of `/Users/syndg/skills/agent-workflows/openai-codex/codex/astra.config.toml`
- `~/.codex/agent-workflows` -> `/Users/syndg/skills/agent-workflows`
- `~/.local/bin/cxa` -> `/Users/syndg/skills/agent-workflows/openai-codex/codex/scripts/cxa`

The profile is a local copy because Codex writes native `/hooks` approval receipts to `[hooks.state]` in the selected profile. Approve each of the four profile hooks through `/hooks`. When the repository template changes, refresh the local profile copy after re-reviewing hooks. Preserve local customizations and existing receipts; do not overwrite the profile blindly.

The latter two paths are symlinks into this checkout. The stable `~/.codex/agent-workflows` link lets the profile's relative role paths resolve from `CODEX_HOME`.

Launch or resume through the alias:

```sh
cxa
cxa --sandbox workspace-write
cxa exec --sandbox workspace-write
cxa resume --last
cxa resume SESSION_ID
```

The alias preserves Codex's normal sandbox default. Pass `--sandbox workspace-write` when the session needs to edit the checkout. The equivalent explicit commands are `codex --profile astra` and `codex --profile astra resume --last`.

### Codex CLI 0.153.3 limits

This adapter targets Codex CLI 0.153.3 (`rust-v0.153.3`). Its hook instructions arrive as persisted `additionalContext`, so they remain in conversation history rather than being request-scoped. Codex 0.153.3 has no provider or request interceptor, and role overrides do not provide a per-role `sandbox_mode`. In V2, `max_depth` is ineffective. Model or provider changes require separate ordinary sessions rather than an in-session switch. The name-specific hook guardrail covers the installed spawn names and the four registered roles; it does not rewrite arbitrary tool calls or transcripts. `SubagentStart` cannot hard-stop a mismatched child event, so it tells that child to report the mismatch instead of working.

The hooks provide routing and instruction guardrails only. They do not claim billing enforcement or an operating-system security boundary.

## Files and portability

- [`openai-codex/orchestrator.md`](openai-codex/orchestrator.md) and [`openai-codex/worker.md`](openai-codex/worker.md) define portable policy without Synp or Codex CLI syntax.
- [`openai-codex/synp/index.ts`](openai-codex/synp/index.ts) implements Synp activation, request injection, and worker routing.
- [`openai-codex/synp/agents`](openai-codex/synp/agents) contains the four Synp native agent definitions.
- [`openai-codex/codex/astra.config.toml`](openai-codex/codex/astra.config.toml) defines the explicit Codex CLI profile.
- [`openai-codex/codex/agents`](openai-codex/codex/agents) contains the four profile-scoped Codex role registrations.
- [`openai-codex/codex/hook.ts`](openai-codex/codex/hook.ts) implements Codex CLI hook routing and guardrails.
- [`openai-codex/codex/scripts/cxa`](openai-codex/codex/scripts/cxa) is the short launcher for `codex --profile astra`.

The Synp extension resolves its real file location and reads the shared policies from the parent directory once. Codex CLI receives the same policy files through its profile and hook configuration.

## Verified locally

Checked with Synp 18.1.10:

- Plain `synp` loaded the package. `/fleet` reported active for Astra and inactive for a concurrent Sol session in the same directory.
- A live Astra → Sol → Astra switch removed and restored request policy without changing parent routing settings. Callback probes also covered inactive foreign-provider requests, unknown session identity, task-role translation, payload immutability, and idempotent injection. No alternate authenticated provider was available for a live cross-provider switch.
- Recorded assistant messages confirmed all four native worker roles, plus implicit Eval `agent()` and one-item `workpool()` dispatches: Luna handled factual research and exact editing; Sol handled investigation, implementation, and both Eval defaults.
- A separate final-request probe confirmed orchestrator policy on Astra and worker policy on Luna and Sol. Worker recursion was capped at one and model fallback disabled; parent values remained unchanged.
- The disposable editing fixture passed its behavior checks, with changes limited to the two assigned source files. No worker needed a home-directory policy pointer.

### Codex CLI 0.153.3

- The installed profile copy, asset symlink, and `cxa` symlink were checked without changing `~/.codex/config.toml`.
- Direct hook probes confirmed policy separation, native role mapping, history-free V1/V2 dispatch, leaf-denial branches, malformed JSON exit 1, and malformed `PreToolUse` exit 2. Live `cxa exec` runs covered all four roles with the OpenAI provider, exact models, and requested efforts, medium for Luna and high for Sol; worker policy persisted without parent history. A writable fixture passed with only the two assigned files changed, while the default read-only run blocked edits.
- TUI launch and `cxa resume` both exited 0; resume restored the original conversation and fixture directory. `/hooks` showed `PreToolUse` 1/1, `UserPromptSubmit` 1/1, `SubagentStart` 1/1, and `SessionStart` 2/2, including one existing global hook and this profile's hook.

## Synp limits

- Requested models are not a hard billing guarantee or security boundary. Disabling worker model and usage-aware fallbacks does not disable every authentication fallback. Check actual runtime evidence rather than treating startup metadata as proof of the final model; agents should report a known mismatch.
- Worker startup routing and policy injection require the extension to load in that child. Extension-disabled or restricted children are not covered.
- The public API cannot disarm a worker's already-armed prewalk. Startup rejects that worker, reports the error, blocks work tools, and forces an error result instead of treating it as a valid fleet worker.
- Activation requires a session discoverable through the public global agent registry. Sessions using private, non-global registries remain inactive rather than being guessed to be main sessions or fleet workers.
- Read-only exploration is a tool policy, not an operating-system sandbox.
- Workers share the project checkout. Astra must assign file ownership and sequence overlapping edits; parallel execution does not isolate writes.
- The package does not configure authentication or change harness source. It uses public extension and session APIs and leaves unrelated specialists and inactive main sessions alone.
