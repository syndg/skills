# mattpocock-skills

## Unreleased

- Make `diagnosing-bugs` use a repository's documented diagnosis tools (`docs/agents/diagnose.md`): its reproduce command first for a reported issue, then its named read-only probes for production state, never ad hoc production SQL.
- Remove the remote T3 delegation skill and its router, catalog, and installation entries. Keep direct server access through `synclaw-server`.
- Make `to-spec` publish one approved, revision-grounded spec and implementation plan for a fresh implementation session. Keep issue decomposition an explicit user choice.
- Make `implement` own verification and repairs around direct, independent Standards and Spec reviews. Keep model selection environment-owned, provide portable handoffs when required reviewers are unavailable, and review scoped uncommitted and untracked work before authorized commits.
- Remove the entire Impeccable skill bundle, its vendor listing, fork-validator requirements, and teaching-reference dependency.
- Add a required simplicity and test-value check to `mp-code-review`. Review architectural burden and unconfirmed plan assumptions with evidence, concrete alternatives, preserved guarantees, and targeted verification; keep the existing two-axis, read-only workflow.
- Add an explicit OpenAI Codex CLI Astra profile and a branch-persistent `/fleet on|off|toggle|status` control for the Synp fleet extension. The Codex profile uses the OpenAI provider, bare Astra/Sol/Luna model IDs, four profile-scoped native worker roles, native history-free dispatch, and the `cxa` launch/resume shortcut. Hook trust remains an explicit approval step, and plain `codex` defaults stay unchanged.
- Tune the OpenAI Codex fleet for selective delegation. Astra keeps small coherent work, final synthesis, and small review fixes; bounded workers own delegated work through a usable artifact. Named Luna explorer/editor roles use medium effort, named Sol investigator/implementer roles use high effort, while the implicit Sol implementer remains a safe fallback. The policy batches independent work, avoids duplicate investigation and repeated polling, and defers shared validation until concurrent edits settle. Restart Synp or OMP sessions after updating package policy or agent definitions.
- Add curated DOX scope briefs with full standing meaning, applicable binding obligations, and on-demand ADR rationale. Keep retrieval eligibility, context reuse, and maintenance in the installed skill; source facts and runtime commands bypass retrieval. Reviews cover the actual work, and maintenance captures newly settled durable meaning as well as correcting stale records.
- Recover harness-clipped DOX output before using it, and distinguish required post-change meaning review from a redundant retrieval call.

## 1.3.1

### Patch Changes

- [#1121](https://github.com/mattpocock/skills/pull/1121) [`c5b9869`](https://github.com/mattpocock/skills/commit/c5b98691982c4f0d3a5e40ab09566b3b84721e00) Thanks [@mattpocock](https://github.com/mattpocock)! - `ask-matt` no longer says `diagnosing-bugs` hands off to `improve-codebase-architecture` from a post-mortem; that step was removed. It now points you at `/retro` once the fix is in, to ask what would have prevented the bug, and at `/improve-codebase-architecture` where the finding is a missing seam. The `diagnosing-bugs` docs page drops the same stale hand-off. Thanks @Ygilany for spotting it ([#1117](https://github.com/mattpocock/skills/issues/1117)).

## 1.3.0

### Minor Changes

- [#1120](https://github.com/mattpocock/skills/pull/1120) [`2aecca1`](https://github.com/mattpocock/skills/commit/2aecca12ea9ff047f76c8178cb64dfeafd192abe) Thanks [@mattpocock](https://github.com/mattpocock)! - Graduate **`implement-spec`** into the **Engineering** bucket, so it ships in the Claude Code plugin, gets a docs page, and is routed by `ask-matt` as the parallel alternative to per-ticket `implement`.

  `implement-spec` (user-invoked) implements a whole spec in one run. It reads the tickets as a **task graph**, runs implementer subagents in their own worktrees across the ready **frontier**, and lands everything on one **integration branch**, closing out with `code-review`. Ahead of graduating:

  - The goal is now the integration branch, not a PR. A draft PR opens only when the issue tracker closes work through PRs or you ask for one, and only after the first merge (a branch with no commits ahead of main can't open one). Without a PR, the tickets are resolved the way the tracker closes work.
  - It points at the issue tracker like its siblings, telling you to run `/setup-matt-pocock-skills` when none has been provided, rather than silently defaulting to `gh`.
  - Each implementer confirms its worktree is based on the integration branch, builds its ticket with `tdd`, and merges the integration tip into its own branch before reporting done, so each merge is a fast-forward.

- [#1120](https://github.com/mattpocock/skills/pull/1120) [`2aecca1`](https://github.com/mattpocock/skills/commit/2aecca12ea9ff047f76c8178cb64dfeafd192abe) Thanks [@mattpocock](https://github.com/mattpocock)! - Graduate **`pr`** into the **Engineering** bucket, so it ships in the Claude Code plugin, gets a docs page, and is routed by `ask-matt` as the PR-body close-out.

  `pr` (model-invoked) is the shape a pull request body should take: a summary as the smallest visual that makes the change clear (pseudocode, a call tree, a file tree, Mermaid, a diff), before/after evidence that it works, and a merge-danger call (one-way or two-way door, plus blast radius). The Summary visuals are adapted from Dex Horthy's `show-me`, credited in the skill's `CREDITS.md`.

- [#1120](https://github.com/mattpocock/skills/pull/1120) [`2aecca1`](https://github.com/mattpocock/skills/commit/2aecca12ea9ff047f76c8178cb64dfeafd192abe) Thanks [@mattpocock](https://github.com/mattpocock)! - Graduate **`retro`** into the **Engineering** bucket, so it ships in the Claude Code plugin, gets a docs page, and is routed by `ask-matt` as the last step of the main flow, after `code-review`.

  `retro` (user-invoked) looks back at a coding session and suggests changes to the agent's environment rather than the code: navigation pointers, automated checks, coding standards, steering files, tool economy, information access. It classifies each coding-standards finding first: a mechanical violation gets a deterministic check (a linter rule, a pre-commit hook, or a CI job), and `CODING_STANDARDS.md` is kept for genuine judgement calls. A repo with no guardrail at all is a finding in its own right.

- [#1120](https://github.com/mattpocock/skills/pull/1120) [`daa01d8`](https://github.com/mattpocock/skills/commit/daa01d8aa68ad5c61b68970ec2018d0ce9567be6) Thanks [@mattpocock](https://github.com/mattpocock)! - Remove the **`resolving-merge-conflicts`** skill. It's no longer needed, and nothing replaces it: the agent works through an in-progress merge or rebase conflict without a dedicated skill. It leaves the Claude Code plugin, the README and the `ask-matt` router. Its docs page at `https://aihero.dev/skills-resolving-merge-conflicts` stays up, marked archived.

- [#1120](https://github.com/mattpocock/skills/pull/1120) [`006a52b`](https://github.com/mattpocock/skills/commit/006a52be23e0178375e083e30535fa8224471f3e) Thanks [@mattpocock](https://github.com/mattpocock)! - Rename the `CONTEXT.md`/`CONTEXT-MAP.md` domain-doc convention to `GLOSSARY.md`/`GLOSSARY-MAP.md` everywhere the skills read and write it (`domain-modeling`, `grill-with-docs`, `improve-codebase-architecture`, `setup-matt-pocock-skills`, `triage`, `tdd`, `diagnosing-bugs`, `ask-matt`, `codebase-design`, `wait-what`, `pr`), plus the docs pages and this repo's own root glossary.

  If you have an existing `CONTEXT.md` (or `CONTEXT-MAP.md`) from before this change, `git mv` it to the new name: the skills only look for `GLOSSARY.md`/`GLOSSARY-MAP.md` going forward.

### Patch Changes

- [#848](https://github.com/mattpocock/skills/pull/848) [`f02e2ed`](https://github.com/mattpocock/skills/commit/f02e2ed3624d031272f8547742d23bf6bca8b072) Thanks [@mattpocock](https://github.com/mattpocock)! - domain-modeling: trigger on discussing codebase terminology and on writing or editing a GLOSSARY.md or an ADR directly, replacing the narrower "pin down domain terminology or a ubiquitous language" / "record an architectural decision" phrasing. Also drops the "another skill needs to maintain the domain model" caveat, since that's the invoking skill's job to state explicitly, not this description's.

- [#911](https://github.com/mattpocock/skills/pull/911) [`4f28947`](https://github.com/mattpocock/skills/commit/4f289474bad013fe2be8f8769d733f59d9103d6b) Thanks [@mattpocock](https://github.com/mattpocock)! - Quote the `description` front matter in `to-spec`, `code-review`, `setup-matt-pocock-skills`, `writing-fragments`, `writing-shape`, and `wait-what`. An unquoted colon-space left over from the em-dash sweep in [#905](https://github.com/mattpocock/skills/issues/905) made each block invalid YAML, so `skills.sh` skipped all six during discovery and they couldn't be listed or installed via `npx skills`.

- [#917](https://github.com/mattpocock/skills/pull/917) [`85f83d3`](https://github.com/mattpocock/skills/commit/85f83d3fde1d3a90d5c9a657f6998c79a6c37308) Thanks [@mattpocock](https://github.com/mattpocock)! - grilling: update the round template so consecutive questions are separated by a horizontal rule (`---`) instead of running together.

- [#879](https://github.com/mattpocock/skills/pull/879) [`d419977`](https://github.com/mattpocock/skills/commit/d419977fe07d9e1607d3523f3579310bbb076b93) Thanks [@mattpocock](https://github.com/mattpocock)! - grilling: remove em-dashes from `SKILL.md`, replacing them with colons and semicolons so the instructions read as plain text.

- [#905](https://github.com/mattpocock/skills/pull/905) [`e6e9577`](https://github.com/mattpocock/skills/commit/e6e957797d8cceb5b351c0dc840369523f9fb8fb) Thanks [@mattpocock](https://github.com/mattpocock)! - Remove every em-dash from the repo's prose (docs, `SKILL.md` files, ADRs, `README.md`, scripts, JSON/YAML metadata), hand-rewriting each sentence with a comma, colon, period, parentheses, or conjunction rather than mechanically substituting the character. `CLAUDE.md`/`AGENTS.md` now says not to reintroduce them.

- [#878](https://github.com/mattpocock/skills/pull/878) [`e3e547b`](https://github.com/mattpocock/skills/commit/e3e547b57d549110a0aa6ff40fd7b871c01c76c9) Thanks [@mattpocock](https://github.com/mattpocock)! - Standardize cross-skill invocation on an explicit "call the Skill tool" instruction instead of bare `/skill`-style prose, across `code-review`, `diagnosing-bugs`, `grill-with-docs`, `grill-me`, `improve-codebase-architecture`, `tdd`, `to-spec`, `to-tickets`, `triage`, and `wayfinder`.

  - A skill that names another skill in prose ("run the `/grilling` skill") does not reliably cause it to load. This is the documented rough edge behind `grill-with-docs`'s most-reported problem. Naming the tool directly (`Call the Skill tool with "grilling"`) is intended to raise the hit rate. Dropping the leading `/` also makes the instruction harness-neutral rather than less: it no longer assumes Claude Code's trigger syntax.
  - A step needing more than one skill now says so as multiple calls ("Call the Skill tool twice, for `grilling` and `domain-modeling`"), not one call carrying two names.
  - Documents the convention in `.agents/invocation.md` for future skills to follow.

- [#880](https://github.com/mattpocock/skills/pull/880) [`1dab982`](https://github.com/mattpocock/skills/commit/1dab98299c3b81f560026c01b7ebf55ed5d91373) Thanks [@mattpocock](https://github.com/mattpocock)! - Stop skills from trying to reach user-invoked skills through the Skill tool: fix cross-skill references that violated the "no other skill can call it" invariant in `.agents/invocation.md`, in `to-spec`, `wayfinder`, `to-tickets`, `triage`, `code-review`, and `diagnosing-bugs`.

  - `to-spec`, `wayfinder`, `to-tickets`, `triage`, and `code-review` each carried a precondition ("...run `/setup-matt-pocock-skills` if not") that PR [#878](https://github.com/mattpocock/skills/issues/878) rewrote into a literal `Call the Skill tool with "setup-matt-pocock-skills"` instruction. `setup-matt-pocock-skills` is user-invoked, so none of these skills (user-invoked or model-invoked) can call it. Reworded all five as instructions for the agent to tell the human to run it instead.
  - `diagnosing-bugs`'s Phase 6 post-mortem hand off to `improve-codebase-architecture` (also user-invoked) the same way, from an autonomous, often-unattended bug-fixing flow with no human in the loop to catch the failed call. Removed the hand-off outright rather than softening it, since it rarely fired in practice. Phase 6 is now "Cleanup" only; the mechanical checklist is untouched.
  - Added a carve-out paragraph to `.agents/invocation.md`'s "Dependencies between them" section: the `Call the Skill tool with "name"` convention only applies when the named skill is model-invoked. This is the section PR [#878](https://github.com/mattpocock/skills/issues/878) introduced without reconciling it against the user-invoked/model-invoked invariant stated eight lines above it; the gap is most of why this bug reached six call sites instead of one.

  Fixes [#453](https://github.com/mattpocock/skills/issues/453).

- [#904](https://github.com/mattpocock/skills/pull/904) [`594f0f8`](https://github.com/mattpocock/skills/commit/594f0f83188921a60d45d63d6cdac509de20df2c) Thanks [@mattpocock](https://github.com/mattpocock)! - wait-what: follow `GLOSSARY-MAP.md` to the right `GLOSSARY.md` when a repo indexes multiple contexts that way instead of keeping a single root `GLOSSARY.md`.

## 1.2.3

### Patch Changes

- Make `diagnosing-bugs` redact secrets before showing commands, outputs, or captured artifacts. Keep credentials in environment variables and quote only signal-bearing lines.
- Remove harness-specific tool and agent-type names from `mp-code-review`, `codebase-design`, and `improve-codebase-architecture`.
- Remove wizard time estimates. Progress is counted in stages instead.
- Scope `dox` to repository work that may be governed by recorded contracts. Skip redundant calls for external tools, runtime connectivity checks, Git-only actions, and follow-ups that do not change repository content. Run one intent-preserving changed-file impact review after substantive content changes.
- Make `setup-matt-pocock-skills` place a minimal DOX activation pointer in root `AGENTS.md` for configured repositories while leaving retrieval and change-impact procedure in the installed `dox` skill.

## 1.2.2

### Patch Changes

- Make `writing-for-agents` model-invokable in Codex again and update its display metadata after the rename from `writing-great-skills`.

## 1.2.0

### Minor Changes

- Add `agents/openai.yaml` metadata beside promoted skills and synchronize user-only invocation policy across harnesses.
- Promote `to-questionnaire` into Productivity as a user-invoked skill.
- Promote `wizard` into Engineering and make it model-invoked.
- Reshape `prototype` around self-contained HTML logic demos and preserved `prototype/<name>` evidence branches.
- Add `wait-what`, which re-pitches a message with plain language and the Ubiquitous Language from the applicable `AGENTS.md` hierarchy or DOX receipt.
- Rename `writing-great-skills` to `writing-for-agents` and broaden it to every document an agent consumes.
- Add a YAGNI scope filter to `improve-codebase-architecture`, biased toward actively changed paths.

### Patch Changes

- Expand `ask-matt` with phase-boundary guidance across Continue, `/clear`, `/handoff`, subagents, and `/compact`.
- Align tracker setup and local Markdown tickets with the current spec flow while keeping AGENTS/DOX as this fork's project-contract storage.
- Migrate repository-wide issue-tracker language from legacy `CONTEXT.md` storage into the root `AGENTS.md` contract.
- Rework `grilling` into numbered dependency-ready frontier rounds, with facts delegated and decisions left to the human.
- Retire `ubiquitous-language`, `design-an-interface`, `qa`, and `request-refactor-plan` after their behavior moved into promoted skills. Keep this fork's personal and vendor buckets unchanged.
- Finish the `to-prd` to `to-spec` rename, including `mp-code-review` and tracker templates.

## 1.1.0

### Minor Changes

- [#406](https://github.com/mattpocock/skills/pull/406) [`930a450`](https://github.com/mattpocock/skills/commit/930a450089f77a49af09001d955db8452a4b867d) Thanks [@mattpocock](https://github.com/mattpocock)! - Bring the **`ask-matt`** router up to date with the full skill set. It now maps five skills it was missing: **`tdd`** (woven into the main flow as the red-green engine `implement` drives), **`diagnosing-bugs`** (a new "Something's broken" on-ramp — there was previously no route for a bug), **`domain-modeling`** and **`codebase-design`** (a new "Vocabulary underneath" section), and **`grilling`** (the shared interview primitive). `prototype` is fleshed out as a standalone and the description broadens from "user-invoked skills" to "the skills". A maintenance rule is added to `CLAUDE.md` so any future skill add/rename/remove or flow change triggers an `ask-matt` re-check, beside the existing docs-page re-sync rule.

- [#464](https://github.com/mattpocock/skills/pull/464) [`639df6e`](https://github.com/mattpocock/skills/commit/639df6e7386dfddc739b2aecdeff37a876f2483b) Thanks [@mattpocock](https://github.com/mattpocock)! - Promote and harden **`code-review`**. The in-progress **`review`** skill is renamed to **`code-review`** and moved from `in-progress/` into `engineering/`: it now ships in the plugin, is listed in the top-level and Engineering READMEs (Model-invoked), and has a docs page at `docs/engineering/code-review.md`. The `/implement` skill and docs point at `/code-review`.

  It also gains an always-on **Fowler smell baseline** on its Standards axis — a curated ~12 high-signal "Bad Smells in Code" (Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest) inlined into `SKILL.md` as a fixed baseline alongside whatever the repo documents, not a new third axis. Two binding rules keep it safe: a documented repo standard overrides the baseline, and every smell is reported as a judgement call, never a hard violation.

- [#464](https://github.com/mattpocock/skills/pull/464) [`639df6e`](https://github.com/mattpocock/skills/commit/639df6e7386dfddc739b2aecdeff37a876f2483b) Thanks [@mattpocock](https://github.com/mattpocock)! - Sharpen **`grilling`** on two fronts.

  **A confirmation gate.** The agent won't enact the plan until you confirm the shared understanding has been reached — turning the skill's existing "shared understanding" completion criterion into an explicit stop-gate. The `description` also recruits the pretrained **`grill`** leading word ("Grill the user relentlessly") to sharpen invocation, and the docs page is re-synced.

  **Facts vs. decisions.** Grilling now splits _facts_ (look them up — explore the codebase) from _decisions_ (put each one to the human and wait for their answer). The old blanket line — "if a question can be answered by exploring the codebase, explore the codebase instead" — was written for the live-human case, but once another skill runs grilling inside a resolve-the-ticket frame it read as license to answer _decisions_ autonomously too. Separating the two keeps a grilling agent from racing ahead and answering its own questions.

- [#463](https://github.com/mattpocock/skills/pull/463) [`af6d692`](https://github.com/mattpocock/skills/commit/af6d6922c3e2b5288eef155346cbe319e4ed3bd0) Thanks [@mattpocock](https://github.com/mattpocock)! - Add two adjacent Steering failure modes to **`writing-great-skills`**, both about how language you think of as "off" still steers the agent. **Negation** — the _elephant_ — is steering by prohibition: naming what _not_ to do drags the forbidden behaviour into context and makes it _more_ available, not less (_don't think of an elephant_), so the cure is to prompt the **positive**. **Negative Space** — the void — is blindness to the steering done by what you leave _out_: every decision a skill declines is delegated to the agent's priors rather than left neutral, so the cure is to read a draft for its silences and decide each omission deliberately (fill it, or leave it open as a real **branch**). Kept as two entries, not one — they carry different diagnostics and different cures — each a full `GLOSSARY.md` entry plus a `SKILL.md` failure-mode bullet, matching how every other failure mode is carried.

- [`850873c`](https://github.com/mattpocock/skills/commit/850873cd73d5f81826ebf512ad35d2b1e113001f) Thanks [@mattpocock](https://github.com/mattpocock)! - Make the **`prototype`** skill model-invoked, so the agent can reach for it autonomously (and other skills can too). Its description is rewritten around the leading word _prototype_ — throwaway code that answers a design question — with one trigger per branch (state/logic sanity-check, or UI exploration).

- [#409](https://github.com/mattpocock/skills/pull/409) [`0d74d01`](https://github.com/mattpocock/skills/commit/0d74d01cbc64ca27778a49b38599f70c534e76a0) Thanks [@mattpocock](https://github.com/mattpocock)! - Add the **`research`** skill — a small, model-invoked skill that spins up a **background agent** to investigate a question against **primary sources** (official docs, source code, specs, first-party APIs), then leaves a single cited Markdown file wherever the repo keeps such notes. It's delegable reading legwork: you keep working while it reads, and get back a document to grill, plan, or design against. Listed in the top-level and Engineering READMEs (Model-invoked), added to `.claude-plugin/plugin.json`, given a docs page at `docs/engineering/research.md`, and routed as a Standalone in `ask-matt`.

- [#469](https://github.com/mattpocock/skills/pull/469) [`a0329ba`](https://github.com/mattpocock/skills/commit/a0329ba95751f58566ed7ab484475917a68f1629) Thanks [@mattpocock](https://github.com/mattpocock)! - Split the **`to-issues`** skill into a lean **Process** and a **Reference** section, and teach it to handle a **wide refactor** — a single mechanical change (like renaming a column) whose **blast radius** fans across the whole codebase, breaking thousands of call sites at once so no vertical slice can land green. The drafting step now points at two co-located reference blocks: the **Vertical slice rules** for ordinary tracer bullets, and **Wide refactors**, which slices the change by **expand–contract** (expand the new form beside the old, migrate call sites in batches sized by blast radius, then contract the old form away) so CI stays green batch to batch — or, when it can't, only at a final integrate-and-verify issue. The issue body template moves into Reference too.

- [#464](https://github.com/mattpocock/skills/pull/464) [`386d4ff`](https://github.com/mattpocock/skills/commit/386d4ff719a7c420ad1454232d0436b01f1b8c17) Thanks [@mattpocock](https://github.com/mattpocock)! - Unify the planning skills. **`to-prd` is renamed to `to-spec`** — "spec" is now the single through-line term (it still opens with "you may know this document as a PRD" for discoverability). **`to-plan` and `to-issues` are merged into one `to-tickets` skill, and `to-issues` is deleted.**

  `to-tickets` breaks a plan, spec, or conversation into a set of **tickets** — tracer-bullet vertical slices, each declaring its **blocking edges**. That one artifact reads two ways depending on the tracker `/setup-matt-pocock-skills` configured: a **local file** (`tickets.md`) writes the edges as text and you work it top-to-bottom by hand; a **real tracker** writes them as native blocking links, so any ticket whose blockers are done is on the frontier and several agents can run at once. The edges live in the ticket either way — the medium only decides whether anything acts on them in parallel.

  Publishing prefers the tracker's **native sub-issues** for parent → slice and **native blocking edges** for `Blocked by` where the tracker supports them, keeping the `## Parent` / `## Blocked by` body sections as the fallback. The "What to build" template points at where a `/prototype`'s code lives rather than inlining a snippet from it.

  `ask-matt`'s main flow now routes `idea → /to-spec → /to-tickets → /implement`, and there are human-facing docs pages at `docs/engineering/to-spec.md` and `docs/engineering/to-tickets.md`.

- [#464](https://github.com/mattpocock/skills/pull/464) [`0557d57`](https://github.com/mattpocock/skills/commit/0557d57579d9b3d39839fdaf8d4a6542b17539ce) Thanks [@mattpocock](https://github.com/mattpocock)! - Settle wayfinder's place in the docs as a **situational on-ramp**, not the new main entry flow — the grill-led _idea → ship_ chain stays the front door (crowning wayfinder as the default spine is a v2-sized move, not a 1.1). The **`ask-matt`** router now names wayfinder's concrete triggers — a greenfield project or a huge feature build, too big for one session — and the two grill front doors (**`grill-me`**, **`grill-with-docs`**) signpost _up_ to wayfinder for the effort that's too big to hold in one session, so the on-ramp is discoverable from where a reader actually starts.

- [#464](https://github.com/mattpocock/skills/pull/464) [`639df6e`](https://github.com/mattpocock/skills/commit/639df6e7386dfddc739b2aecdeff37a876f2483b) Thanks [@mattpocock](https://github.com/mattpocock)! - Graduate and reframe **`wayfinder`** — the skill for planning a huge chunk of work, more than one agent session can hold. It moves out of `in-progress/` into `engineering/` (plugin entry, top-level + Engineering READMEs under **User-invoked**, a docs page at `docs/engineering/wayfinder.md`, and a route in `ask-matt`), landing as a mature skill. The rename and reframe that got it there:

  - **`decision-mapping` is renamed to `wayfinder`**, invoked as `/wayfinder`. "Decision map" was jargony and inaccurate — only one ticket type is actually a decision. The reframe charts a route through a foggy problem instead, giving one coherent leading-word frame — **fog of war**, **frontier**, **the map** — rather than an invented term layered on top.
  - **Destination as the leading word.** Wayfinding finds the _way_ to a destination; it doesn't charge at building it. Naming the destination is the first act of charting — it fixes the scope and shapes every ticket — so the map gains a `## Destination` field every session orients to, and triage pins it before any ticket exists.
  - **Plan, don't do.** The map produces **decisions, not deliverables**; it's done when nothing is left to decide before someone builds the thing. An effort can override this in its Notes.
  - **The map is an index, not a store.** A decision lives in exactly one place — its ticket — so the map only gists and links, never restates; graduating fog into a ticket clears the graduated patch so nothing lingers in two places.
  - **Collaborative by default.** The map moves off a local Markdown file onto the repo's issue tracker: a single `wayfinder:map` issue whose tickets are its child issues — one shared URL the team can watch. Sessions load the map at low resolution and zoom into tickets on demand. Wayfinder stays tracker-agnostic (GitHub, GitLab, local-markdown) behind a pointer in `docs/agents/issue-tracker.md`, and `setup-matt-pocock-skills` seeds the "Wayfinding operations" section.
  - **Claim by assignment, not a label.** A session claims a ticket by assigning it to the driving dev — the assignee _is_ the claim — freeing the label vocabulary to `wayfinder:<type>` alone.
  - **Native blocking.** Blocking prefers the tracker's native dependency relationship, which renders the frontier visually in the tracker's own UI so the human sees what's takeable without opening the map. GitHub and GitLab templates spell out the native recipe, with a body-convention fallback.
  - **Fog vs. out of scope, split.** Two plainly-named map sections — `## Not yet specified` (in-scope fog that graduates as the frontier advances) and `## Out of scope` (work ruled beyond the destination, closed, never graduating) — so beyond-destination work no longer reads as takeable frontier.
  - **A fourth `task` ticket type.** For literal manual work that blocks a decision (provisioning access, moving data, signing up for a service) — the one type that _does_ rather than decides, earning its place by unblocking a decision.
  - **HITL / AFK ticket classification.** Every ticket type is **HITL** (human in the loop — grilling, prototype) or **AFK** (agent alone — research; task is either). A HITL ticket only resolves through the live exchange, so "wait for the human" falls out of the label — a grilling agent that answers its own questions has, by definition, broken HITL. (This fixes students' reports of `/wayfinder` grilling _itself_ instead of the human.)
  - **No-fog early exit restored.** If the opening breadth-first grilling surfaces no fog, the journey is small enough for one session — so it stops and asks how you'd like to proceed rather than building a map nobody needs.

### Patch Changes

- [#464](https://github.com/mattpocock/skills/pull/464) [`639df6e`](https://github.com/mattpocock/skills/commit/639df6e7386dfddc739b2aecdeff37a876f2483b) Thanks [@mattpocock](https://github.com/mattpocock)! - Reshape **`tdd`** into a reference-only skill and add a missing anti-pattern.

  **Reference-only.** The red → green → refactor loop is anchored by leading words the model already holds, so the step-by-step Workflow was largely restating the loop. Dropped the Workflow and per-cycle checklist; folded their one durable idea — vertical slices / tracer bullets — into the Anti-patterns section and a short Rules-of-the-loop list. Introduced **seam** as the leading word for where tests go: test only at pre-agreed seams, confirmed with the user before any test is written. Also dropped the refactor stage — TDD is now red → green; refactoring belongs to the review stage, so the refactor rule and `refactoring.md` moved out (its home is `code-review`).

  **Tautological tests.** Added the tautological-test anti-pattern: a test whose assertion is recomputed the way the code computes it passes by construction and gives zero confidence — distinct from the implementation-coupling anti-pattern already covered. Added as a peer at the same sites: a Philosophy principle (expected values must come from an independent source of truth), a checklist gate, and a BAD/GOOD example pair in `tests.md`.

- [`e00eadb`](https://github.com/mattpocock/skills/commit/e00eadb4bb32c3d5a631ead1a5ed5d6a7c5f74e2) Thanks [@mattpocock](https://github.com/mattpocock)! - Extend the **`triage`** skill to triage external pull requests, treating a PR as an issue with attached code that runs through the same roles and state machine. PRs flow inline alongside issues (gated by a per-repo setup toggle), discovery surfaces only external PRs, the bug-only "reproduce" step is generalized into a single "verify the claim" step, and a redundancy check resolves already-implemented requests to `wontfix` without polluting the out-of-scope knowledge base. `setup-matt-pocock-skills` gains the PRs-as-a-request-surface toggle for GitHub/GitLab.

- [#472](https://github.com/mattpocock/skills/pull/472) [`d869d45`](https://github.com/mattpocock/skills/commit/d869d45afc32beab1c2d1350f8de5e81589512cd) Thanks [@mattpocock](https://github.com/mattpocock)! - Fix **`wayfinder`** hardcoding the issue-tracker doc path, which broke the indirection the rest of the suite relies on.

  `to-issues`, `to-prd`, and `triage` never name a path — they resolve the tracker through the `### Issue tracker` block that `setup-matt-pocock-skills` writes into `CLAUDE.md` / `AGENTS.md`, which points at the tracker doc wherever it lives. Wayfinder instead pinned the literal `docs/agents/issue-tracker.md`, so in a repo that keeps its agent docs elsewhere it silently fell back to the local-markdown tracker — even one whose `CLAUDE.md` clearly declares GitHub issues. It now resolves the doc via that same pointer and reads its "Wayfinding operations" section by name, keeping the indirection consistent across the suite.

## 1.0.1

### Patch Changes

- [`d20ee26`](https://github.com/mattpocock/skills/commit/d20ee2684e2a9442698ac3c1e0f2c5b68c4cf296) Thanks [@mattpocock](https://github.com/mattpocock)! - Make the **`teach`** skill reuse-first. Lessons are now built from reusable **components** in `./assets/` — stylesheets, quiz widgets, simulators, diagram helpers. Reuse is the default: the agent reads `./assets/` before authoring a lesson, builds from what's there, and extracts anything new and reusable into a component rather than inlining it.

## 1.0.0

### Major Changes

- [`47bde84`](https://github.com/mattpocock/skills/commit/47bde84da032afb2e5058f997f3bbca47d321dbd) Thanks [@mattpocock](https://github.com/mattpocock)! - Add the **`ask-matt`** skill — a user-invoked router that points you at the right skill or flow for your situation.

  **Breaking:** `ask-matt` routes over the other user-invoked skills in this repo, so it expects them to be installed.

- [`47bde84`](https://github.com/mattpocock/skills/commit/47bde84da032afb2e5058f997f3bbca47d321dbd) Thanks [@mattpocock](https://github.com/mattpocock)! - Add the shared design skills and rewire existing skills onto them.

  - New **`codebase-design`** skill — the deep-module vocabulary (module, interface, depth, seam, adapter) and the principles for putting a lot of behaviour behind a small interface. The language that previously lived in `improve-codebase-architecture/LANGUAGE.md` now lives here, generalized for reuse across skills.
  - New **`domain-modeling`** skill — actively build and sharpen a project's domain model, stress-testing terms against the glossary and keeping `CONTEXT.md` and ADRs current.
  - `improve-codebase-architecture` now draws its architecture vocabulary from `/codebase-design` and its domain model from `/domain-modeling`.
  - `tdd` now leans on `/codebase-design` for interface-design guidance — its inline `deep-modules.md` / `interface-design.md` notes were removed in favour of the shared skill.
  - `grill-with-docs` now builds the domain model inline via `/domain-modeling`.

  **Breaking:** these skills now depend on the new `codebase-design` / `domain-modeling` skills, so you must install them too.

- [`47bde84`](https://github.com/mattpocock/skills/commit/47bde84da032afb2e5058f997f3bbca47d321dbd) Thanks [@mattpocock](https://github.com/mattpocock)! - Remove the **`caveman`** and **`zoom-out`** skills.

  - `caveman` was a duplicate of another skill I was testing and was never meant to be public.
  - `zoom-out` went unused in practice, so it's been removed from the repo.

  **Breaking:** both skills have been removed.

- [`47bde84`](https://github.com/mattpocock/skills/commit/47bde84da032afb2e5058f997f3bbca47d321dbd) Thanks [@mattpocock](https://github.com/mattpocock)! - Rename the **`diagnose`** skill to **`diagnosing-bugs`**.

  **Breaking:** invoke it as `/diagnosing-bugs` — the old `/diagnose` name no longer exists.

- [`47bde84`](https://github.com/mattpocock/skills/commit/47bde84da032afb2e5058f997f3bbca47d321dbd) Thanks [@mattpocock](https://github.com/mattpocock)! - Replace **`write-a-skill`** with **`writing-great-skills`**.

  - Removed `write-a-skill`.
  - Added `writing-great-skills` (plus its `GLOSSARY.md`) — a reference for writing and editing skills well: the vocabulary and principles that make a skill predictable, hunting no-ops down to the sentence level.
  - Exposed `grilling` as a model-invoked skill — the reusable interview loop behind `grill-me` and `grill-with-docs`.

  **Breaking:** `write-a-skill` has been removed; use `writing-great-skills` instead.

### Minor Changes

- [`47bde84`](https://github.com/mattpocock/skills/commit/47bde84da032afb2e5058f997f3bbca47d321dbd) Thanks [@mattpocock](https://github.com/mattpocock)! - Add the **`resolving-merge-conflicts`** skill — a loop for resolving an in-progress git merge or rebase conflict. Standalone, with no dependencies on other skills.

- [`47bde84`](https://github.com/mattpocock/skills/commit/47bde84da032afb2e5058f997f3bbca47d321dbd) Thanks [@mattpocock](https://github.com/mattpocock)! - Rename the skill taxonomy from **Commands / Skills** to **User-invoked / Model-invoked** across the docs, and add `docs/invocation.md` defining the split: user-invoked skills are reachable only when you type them and exist to orchestrate; model-invoked skills can also be reached automatically when the task fits. A user-invoked skill may invoke model-invoked skills, but never another user-invoked one.

### Patch Changes

- [`47bde84`](https://github.com/mattpocock/skills/commit/47bde84da032afb2e5058f997f3bbca47d321dbd) Thanks [@mattpocock](https://github.com/mattpocock)! - Tighten the **`review`** skill: fail-fast ref check, single-sourced rules, and no-op cuts.
