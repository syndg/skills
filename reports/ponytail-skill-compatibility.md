# Ponytail skill compatibility

## Verdict

**Adapt, do not install the full plugin or copy the upstream core verbatim.** Ponytail contains six real Agent Skills, but the repository is a hybrid distribution: skills plus always-on rules, lifecycle hooks, host plugins, commands, a Pi extension, and persistent mode state. The full distribution would add unbounded ambient policy beside this repository's routed, composable skills. Several rules conflict with local completeness, testing, contract, and clean-cutover requirements.

After clarifying that the desired behavior should apply to every coding task, the safe local form is one model-invoked, hook-free vendor adaptation of the core ladder. Do not install the plugin in the same Claude, Codex, OpenCode, or Pi profile, and do not copy Ponytail's `AGENTS.md` or host rule files into this repository.

Assessed source: Ponytail 4.9.0 at commit [`2ed6c52c9d7e5e56942508591085fd45dea277d3`](https://github.com/DietrichGebert/ponytail/tree/2ed6c52c9d7e5e56942508591085fd45dea277d3).

## What Ponytail is

Ponytail calls itself an "agent-portable skill distribution": `skills/` owns the behavior and host files adapt it to each client ([`docs/agent-portability.md:3-5`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/docs/agent-portability.md#L3-L5)).

- **True Agent Skills:** `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, and `ponytail-help` each have `SKILL.md` ([`docs/agent-portability.md:41-49`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/docs/agent-portability.md#L41-L49)).
- **Not Agent Skills:** root `AGENTS.md`, `.agents/rules/ponytail.md`, editor rule copies, hooks, commands, status-line scripts, and plugin manifests. These are steering or integration.
- **The npm package is a host plugin package, not a skill installer.** Its main export is the OpenCode plugin; it also declares a Pi extension and points Pi at `skills/` ([`package.json:19-42`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/package.json#L19-L42)). There is no standalone Ponytail CLI.

A raw copy of `skills/ponytail/SKILL.md` is a real skill, but it is not equivalent to the plugin. It cannot implement the promises that the mode is "ACTIVE EVERY RESPONSE," persists, or switches globally through `/ponytail lite|full|ultra` ([`skills/ponytail/SKILL.md:26-30`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail/SKILL.md#L26-L30)). Those behaviors come from adapters and hooks.

## Supported clients and installs

The first-party portability table covers three tiers ([`docs/agent-portability.md:7-33`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/docs/agent-portability.md#L7-L33)):

| Tier | Hosts | Behavior |
|---|---|---|
| Plugin or extension | Claude Code/Desktop, Codex CLI/Desktop, GitHub Copilot CLI, OpenCode, Pi, Gemini CLI, Hermes Agent, Qoder, Grok Build, Devin CLI | Skills and commands; most adapters also inject the core rules automatically. |
| Skill collection | OpenClaw, Swival | One or more of the six skill packages. Swival also supports an `AGENTS.md` fallback. |
| Instruction-only | Cursor, Windsurf, Cline, Copilot editor chat, Antigravity, CodeWhale, Kiro, Zed, VS Code Codex, Junie, Amp, Jules, generic `AGENTS.md` readers | Always-on rules without reliable mode state, hooks, or all commands. |

Claude uses two `/plugin` prompts. Codex uses marketplace/add commands and then asks the user to review and trust the hooks ([`README.md:108-135`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/README.md#L108-L135)). Pi installs the Git repository; OpenCode loads the npm plugin or a checkout path ([`README.md:158-180`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/README.md#L158-L180)). The README also gives host commands or paths for Gemini, Qoder, Antigravity, Hermes, Swival, Devin, OpenClaw, and Grok ([`README.md:182-264`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/README.md#L182-L264)). Host-managed plugin storage locations are not specified.

## Hooks, configuration, and writes

The current Claude/Codex manifest registers **three** handlers: `SessionStart`, `SubagentStart`, and `UserPromptSubmit` ([`hooks/claude-codex-hooks.json:1-40`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/hooks/claude-codex-hooks.json#L1-L40)). Session start writes mode state, injects the skill body, and emits a status-line setup nudge ([`hooks/ponytail-activate.js:21-93`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/hooks/ponytail-activate.js#L21-L93)). The subagent hook injects the same rules into every subagent unless `PONYTAIL_SUBAGENT_MATCHER` definitely excludes it; invalid regexes and missing agent types fail open and inject ([`hooks/ponytail-subagent.js:31-77`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/hooks/ponytail-subagent.js#L31-L77)).

OpenCode appends the rules to the system prompt every turn and persists mode switches ([`.opencode/plugins/ponytail.mjs:26-44,73-97`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/.opencode/plugins/ponytail.mjs#L26-L44)). Pi injects before every agent turn and registers six commands ([`pi-extension/index.js:114-172,204-210`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/pi-extension/index.js#L114-L172)). This is ambient policy, not ordinary skill invocation.

The instruction builder filters only mode-labelled table rows and examples. The rest of the core remains at lite, full, and ultra levels ([`hooks/ponytail-instructions.js:11-40,77-90`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/hooks/ponytail-instructions.js#L11-L40)). Lite therefore retains the output cap, one-check rule, and `ponytail:` comment convention.

| Write | Source behavior |
|---|---|
| `$XDG_CONFIG_HOME/ponytail/config.json`, `~/.config/ponytail/config.json`, or `%APPDATA%\ponytail\config.json` | Optional default. Precedence is `PONYTAIL_DEFAULT_MODE`, then `defaultMode`, then `full`; `/ponytail default` writes it ([`hooks/ponytail-config.js:4-10,76-100,136-150`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/hooks/ponytail-config.js#L4-L10)). |
| `.ponytail-active` | Claude uses `CLAUDE_CONFIG_DIR` or `~/.claude`; Codex uses `PLUGIN_DATA`; Copilot uses plugin data or the Claude-dir fallback; Qoder uses `~/.qoder` ([`hooks/ponytail-runtime.js:19-35`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/hooks/ponytail-runtime.js#L19-L35)). OpenCode uses `~/.config/opencode/.ponytail-active` ([`.opencode/plugins/ponytail.mjs:26-44`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/.opencode/plugins/ponytail.mjs#L26-L44)). Pi stores a custom session entry. |
| `~/.claude/.ponytail-statusline-nudged` | Written before the agent is asked to offer status-line setup ([`hooks/ponytail-activate.js:56-76`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/hooks/ponytail-activate.js#L56-L76)). |
| `~/.claude/settings.json` | Not changed automatically. If the user accepts the injected offer, a `statusLine` points at Ponytail's script. The uninstaller removes Ponytail's segment ([`scripts/uninstall.js:23-49`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/scripts/uninstall.js#L23-L49)). |
| Project source comments | The core tells the agent to add `ponytail:` comments for simplifications, ceilings, and upgrade paths ([`skills/ponytail/SKILL.md:56-64`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail/SKILL.md#L56-L64)). |
| Optional ledger | `ponytail-debt` may write `PONYTAIL-DEBT.md` when asked ([`skills/ponytail-debt/SKILL.md:40-44`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail-debt/SKILL.md#L40-L44)). |

Pi also calls `ctx.ui.setStatus("ponytail", ...)` unless `hideStatus` is true ([`pi-extension/index.js:70-89`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/pi-extension/index.js#L70-L89)). That may clutter or compete for width with Synp's maintained bottom-right Codex quota status (`skills/personal/synp-update/SKILL.md:39`). The exact layout impact is unknown without installing it.

## Local compatibility findings

### Compatible

- **Packaging:** `skills/vendor/` is the correct bucket for third-party material. [`scripts/link-skills-syndg.sh`](../scripts/link-skills-syndg.sh) includes `vendor`, discovers `skills/<bucket>/<name>/SKILL.md`, and symlinks each directory into `~/.claude/skills`, `~/.agents/skills`, and `~/.codex/skills` (`lines 18-31, 73-75`).
- **Design instincts:** reuse, stdlib/native-first, root-cause fixes, no speculative one-implementation interface, and deleting pass-through layers agree with [`codebase-design`](../skills/engineering/codebase-design/SKILL.md), especially locality, the deletion test, and "one adapter means a hypothetical seam" (`lines 28-30, 64-67`). They also agree with `Speculative Generality` and `Middle Man` in [`mp-code-review`](../skills/engineering/mp-code-review/SKILL.md) (`lines 50-68`).
- **Explicit prose is exempt:** the core says requested reports and walkthroughs must be given in full ([`skills/ponytail/SKILL.md:66-73`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail/SKILL.md#L66-L73)), so explicit [`research`](../skills/engineering/research/SKILL.md) and writing work need not be shortened.
- **Review can be supplemental:** `ponytail-review` is complexity-only and applies no fixes ([`skills/ponytail-review/SKILL.md:44-56`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail-review/SKILL.md#L44-L56)). Explicit invocation can make it a narrow lens rather than a replacement for local review.

### Conflicting

1. **Invocation and precedence.** The description says to invoke on "ANY coding task" and the body says "ACTIVE EVERY RESPONSE" ([`skills/ponytail/SKILL.md:3-15,26-30`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail/SKILL.md#L3-L15)). Without local flags it is model-invoked under [`.agents/invocation.md`](../.agents/invocation.md) (`lines 3-10`), competing with every engineering skill and [`ask-matt`](../skills/engineering/ask-matt/SKILL.md). The plugin injects into every turn and, by default, every subagent. A raw skill copy cannot honor persistence or mode switching, so it is over-broad in triggering and incomplete in behavior.

2. **Completeness.** On complex requests, the core says to ship the lazy version and question the rest in the same response ([`skills/ponytail/SKILL.md:58-64`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail/SKILL.md#L58-L64)). Local work must deliver the requested end-to-end behavior and every acceptance criterion unless the user approves a scope reduction. The main flow treats the issue/spec as binding and checks it independently ([`ask-matt:22-26`](../skills/engineering/ask-matt/SKILL.md), [`mp-code-review:37-44,81-86`](../skills/engineering/mp-code-review/SKILL.md)).

3. **Tests and evidence.** Ponytail permits one runnable check, suggests an assert/demo or one test file, rejects frameworks and fixtures, and exempts trivial one-liners ([`skills/ponytail/SKILL.md:107-112`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail/SKILL.md#L107-L112)). Local [`tdd`](../skills/engineering/tdd/SKILL.md) requires behavior tests at pre-agreed seams and a red-green slice per contract (`lines 18-38`); [`diagnosing-bugs`](../skills/engineering/diagnosing-bugs/SKILL.md) requires the original reproduction and a regression test; [`implement`](../skills/engineering/implement/SKILL.md) uses targeted checks and a final full suite. One check and no framework cannot override existing changed-contract tests.

4. **Callsite discovery and clean cutovers.** The core orders "grep every caller" ([`skills/ponytail/SKILL.md:50-54`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail/SKILL.md#L50-L54)); `ponytail-debt` gives literal shell `grep -rnE` ([`skills/ponytail-debt/SKILL.md:15-23`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail-debt/SKILL.md#L15-L23)). This harness requires its search tool and prefers reference-aware/LSP discovery for symbols. Text grep can miss aliases, generated references, and typed callsites. "Fewest files possible" also conflicts when a clean cutover must update every caller, test, doc, index, or config file.

5. **DOX and project contracts.** Ponytail has no DOX or root-to-nearest contract lookup. Local skills resolve governing context before code work and run change-impact review after substantive changes; [`dox`](../skills/engineering/dox/SKILL.md) makes accepted invariants and verification binding (`lines 24-28, 45-65, 67-75`). `ponytail:` comments plus `PONYTAIL-DEBT.md` can create a second ledger for decisions that belong in canonical DOX records. Copying Ponytail's root `AGENTS.md` would overwrite or compete with this repository's steering and unconfigured contract fallback.

6. **Review overlap.** `ponytail-review` duplicates part of `mp-code-review`'s Standards axis but drops correctness, security, performance, project standards, DOX, and spec compliance. `ponytail-audit` overlaps [`improve-codebase-architecture`](../skills/engineering/improve-codebase-architecture/SKILL.md), but ranks deletion and estimated line count rather than depth, locality, test seams, and governing decisions. They are safe only as explicit narrow lenses.

7. **Local schema.** Upstream has no `agents/openai.yaml`. This repository requires one beside every `SKILL.md`, with Claude and Codex invocation flags kept in sync ([`.agents/invocation.md:5-10`](../.agents/invocation.md)). Verbatim folders fail this contract.

8. **Stale gain command.** `ponytail-gain` still shows the older single-shot 80-94% line reduction and 47-77% cost reduction ([`skills/ponytail-gain/SKILL.md:16-35`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail-gain/SKILL.md#L16-L35)). The README now calls that baseline an artifact and reports a corrected agentic mean of 54% fewer lines, 20% lower cost, and 27% faster ([`README.md:27-29,59-84`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/README.md#L59-L84)). Do not install gain unchanged.

### Unknown or inconsistent

- The README says Claude and Codex run "two" lifecycle hooks, while the manifest registers three handlers ([`README.md:112`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/README.md#L112), [`hooks/claude-codex-hooks.json`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/hooks/claude-codex-hooks.json#L1-L40)). Source behavior should win.
- The README names Aider but gives no Aider-specific path, and the portability table omits it ([`README.md:274`](https://github.com/DietrichGebert/ponytail/blob/2ed6c52c9d7e5e56942508591085fd45dea277d3/README.md#L274)).
- Ponytail does not define precedence when lifecycle-injected context disagrees with another skill or repository contract.
- Duplicate-name behavior is undocumented when the plugin and this repository's symlinked `ponytail*` skills coexist. Avoid that combination.
- Pi status placement beside Synp's quota indicator is unknown without runtime installation.

## Recommended installation mode

Install one adapted skill at:

```text
skills/vendor/ponytail/SKILL.md
skills/vendor/ponytail/agents/openai.yaml
```

Keep it model-invoked so every coding task reaches it, but remove plugin persistence, global modes, status UI, and subagent hooks. The local skill loader provides the intended trigger without a second system-prompt injection path.

Add it to `skills/vendor/README.md` and the fork validator's vendor inventory. Do not add a Ponytail docs page or top-level README entry while it remains an unpromoted vendor skill. Because it is user-reachable and changes the implementation flow, update [`ask-matt`](../skills/engineering/ask-matt/SKILL.md) and re-sync `docs/engineering/ask-matt.md`. The existing linker exposes it to Claude, Agent Skills/Pi, and Codex.

Required adaptations:

1. Keep the YAGNI/reuse/stdlib/native ladder, but remove persistence, global levels, and off-switch claims.
2. Complete the request. Never silently ship a subset. User scope, acceptance criteria, project contracts, and DOX win.
3. Run a strict complexity gate before editing and before delivery. Every added file, layer, dependency, configuration option, helper, and test abstraction must serve a current requirement or existing convention.
4. Replace "fewest files" with "fewest files consistent with a complete cutover." Update every caller and required test, doc, index, and config.
5. Replace shell/text grep with harness search and reference-aware discovery.
6. Remove the three-line output cap. Concision cannot remove verification evidence or blocking details.
7. Remove "one check/no frameworks." Use the project's existing test framework and defend changed observable contracts.
8. Remove automatic `ponytail:` comments and the parallel debt ledger. Follow DOX when configured and the selected `AGENTS.md`/`DECISIONS.md` fallback otherwise.

Do not vendor `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, or `ponytail-help` now. The requested problem is implementation bloat, which the adapted core handles. Review and audit overlap existing flows, debt adds a second ledger and a forbidden shell command, gain is stale, and help documents modes removed by the adaptation.

If the always-on persona is the feature being tested, isolate the upstream plugin in a disposable repository or separate host profile with `PONYTAIL_DEFAULT_MODE=off`, manual activation, and no default subagent injection. Do not combine that experiment with vendored `ponytail*` names. The normal Synp/Claude/Codex profile should remain hook-free.
