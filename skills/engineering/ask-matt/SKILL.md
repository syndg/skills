---
name: ask-matt
description: Ask which skill or flow fits your situation. A router over the skills in this repo.
disable-model-invocation: true
---

# Ask Matt

You don't remember every skill, so ask.

A **flow** is a path through the skills. Most paths run along one **main flow**, and two **on-ramps** merge onto it. Everything else is standalone, or a vocabulary layer that runs underneath.

## The main flow: idea → ship

The route most work travels. You have an idea and want it built.

1. **`/grill-with-docs`** — sharpen the idea by interview. Start here when you **have a codebase**. It leaves a paper trail in the repository's canonical contract: configured DOX records when `dox.config.json` is present, otherwise the applicable root-to-nearest `AGENTS.md` fallback and co-located `DECISIONS.md` when needed. (No codebase? Use `/grill-me` in Standalone. Both run `/grilling`; only `grill-with-docs` keeps durable project context.)
2. **Branch — can you settle every question in conversation?** If a question needs a runnable answer (state, business logic, a UI you have to see), detour through a prototype, bridged by **`/handoff`** in both directions (see Crossing sessions):
   - **`/handoff`** out, then open a fresh session against that file,
   - **`/prototype`** to answer the question with throwaway code,
   - **`/handoff`** back what you learned, and reference it from the original idea thread.
3. **`/to-spec`** turns the settled conversation into one approved spec issue in the configured issue tracker. Its body carries the current requirements, decisions and rationale, a detailed ordered implementation plan grounded in verified paths and symbols at a recorded revision, and acceptance and verification criteria. Requirements stay separate from proposed implementation details.
4. Start a **fresh implementation session** with the issue URL and **`/implement`**. The issue is the handoff; remote tracker work needs no duplicate local plan or Markdown handoff. For a configured local tracker, pass the issue file instead. Progress, deviations, and reviews go in comments; approved requirement changes fold back into the body.

   Choose the planning and implementation models in your environment. Invoking a skill does not switch models. Tell the implementation session which model should review the work.

   **`/implement`** drives **`/tdd`** at the agreed seams, verifies the result, and directly runs **`/mp-code-review`** on its uncommitted work before any final commit. That skill dispatches independent, read-only Standards and Spec reviews with the designated review model, without an intermediary coordinator. It owns capability checks and portable briefs for separate review sessions when routing is unavailable; a missing required review blocks completion rather than becoming self-review or using another model. The implementation session owns repairs and relevant reruns and re-review. Scope, contract, or design disputes return to the user; commits wait for the gates and permission from the user or repository workflow.

   Two optional branches remain:
   - For concrete work already settled in the current conversation, invoke **`/implement`** there without publishing a spec.
   - Only when the human explicitly requests separate build issues, use **`/to-tickets`** after `/to-spec`. It creates tracer-bullet issues with blocking edges, worked blockers-first with `/implement` in fresh sessions. Size or session count alone does not trigger decomposition.

   Reach for **`/tdd`** alone to build a concrete behaviour test-first, or **`/mp-code-review`** alone to review changes against a fixed point. Its Standards and Spec reviews include simplicity and test-value checks and distinguish requirements from generated-plan assumptions.

### Phase boundaries

Keep grilling and `/to-spec` together while the conversation is the source. Once the approved issue captures the plan and its rationale, it supports the fresh implementation session above. For other phase boundaries, use the ordered decision tree in [PHASE-BOUNDARIES.md](./PHASE-BOUNDARIES.md): continue when the reasoning still matters and there is room; `/clear` when it does not; `/handoff` only when context must travel and no existing artifact carries it; use a subagent for scoped AFK work; otherwise `/compact` with an instruction for the next phase. Do not compact mid-phase.

## On-ramps

A starting situation that generates work, then merges onto the main flow.

- **Bugs and requests piling up** → **`/triage`**. It moves issues through triage roles and produces agent-ready issues, which **`/implement`** later picks up.

  Triage is only for issues **you didn't create** — bug reports, incoming feature requests, anything that arrives raw. Tickets that `/to-tickets` produced are already agent-ready, so **don't triage them**.

- **Something's broken** → **`/diagnosing-bugs`**. For the hard ones: the bug that resists a first glance, the intermittent flake, the regression that crept in between two known-good states. It refuses to theorise until it has a **tight feedback loop** — one command that already goes red on *this* bug — then fixes with a regression test. After the fix, recommend **`/improve-codebase-architecture`** when the real finding is that there is no good seam to lock the bug down.

- **A huge, foggy effort — a greenfield project or a huge feature build, too big for one session** → **`/wayfinder`**, the most cognitively demanding flow here. When the way from here to the destination isn't visible yet, it charts a **shared map** of **decision tickets** on the issue tracker and resolves them one at a time — producing **decisions, not deliverables** — until the fog is pushed back and the way is clear. Where **`/grill-with-docs`** sharpens an idea you can hold in one session, wayfinder is for the idea you can't — and it's slower and denser, so save it for exactly that, never a well-scoped feature.

  When the map clears, **it hands off, it doesn't build**: merge onto the main flow at **`/to-spec`**, which collapses the map's linked decisions into one approved spec and detailed plan, then start a fresh `/implement` session from that issue. `/to-tickets` is optional only on explicit human request. Looping the map straight into `/implement` skips that collapse and throws the linked detail away; go straight to `/implement` only when the effort turned out genuinely small.

## Codebase health

Not feature work — upkeep.

- **`/improve-codebase-architecture`** — run whenever you have a spare moment to keep the codebase good for agents to operate in. It surfaces **deepening opportunities**; picking one _generates an idea_ you can take into the main flow at `/grill-with-docs`. It's the survey that finds the candidates; **`/codebase-design`** (below) is the bench you design the chosen one on.

## Implementation discipline

**`/ponytail`** is the model-invoked simplicity layer for coding work. It runs when a task designs, implements, fixes, or refactors code, then finds the smallest complete solution within settled scope: reuse first, standard library and native platform before custom machinery, and no speculative layers. It preserves approved product journeys and visual design while applying its complexity gate before the first edit and before delivery. Ponytail changes implementation shape, not accepted requirements, project contract, TDD loop, or review gates.

## Contract layers underneath

Three model-invoked layers run *beneath* the other skills. They retrieve or maintain the contracts that make a flow coherent. Reach for them directly when the contract, words, or module shape is the problem; or let the skills above pull them in.

- **`/dox`** owns retrieval eligibility, context reuse, and contract maintenance when `dox.config.json` is present. Its curated brief supplies full standing meaning and applicable binding obligations before substantive design or behavioral change and for meaning/ADR questions. Additional named context and ADR rationale are available on demand. Source facts, Git operations, external tools, and runtime commands go directly to their source. Follow the installed skill for the procedure.
- **`/domain-modeling`** — the semantic-adjudication layer for the project's domain language. It challenges fuzzy terms and decides whether a hard-to-reverse choice deserves a durable record. With `dox.config.json`, it updates canonical DOX records and runs `/dox` validation. Without that file, it uses the root-to-nearest `AGENTS.md` and `DECISIONS.md` fallback.
- **`/codebase-design`** — the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality) for designing a module's *shape*: a lot of behaviour behind a small interface at a clean seam. `/tdd` and `/improve-codebase-architecture` both speak it.

## Crossing sessions

- **`/handoff`** creates portable Markdown context when work must move to a new harness, directory, repository, colleague, or a side task found mid-phase and no existing artifact carries the needed context. An approved spec issue already supports the planned-work handoff; pass its URL rather than creating a duplicate file. A merely full context window normally lands on `/compact`.
- **`/compact`** (built-in) — stay in the same conversation while replacing earlier turns with a lossy summary. Use it at an intentional phase boundary only after Continue, `/clear`, `/handoff`, and a scoped subagent have been ruled out.

## Standalone

Off the main flow entirely.

- **`/grill-me`** — the same relentless interview as `/grill-with-docs`, but for when you have **no codebase**. Stateless: it saves nothing locally and builds no durable project contract.
- **`/prototype`** — throwaway code that answers one design question. Logic/state prototypes are self-contained HTML demos; UI prototypes expose several visual directions. Preserve the prototype on a throwaway branch as a primary source, keep only the validated decision on main, and link the branch from the implementation issue.
- **`/research`** — delegate reading legwork to a **background agent**: it investigates a question against **primary sources**, then leaves a cited Markdown file in the repo. Keep working while it reads. The file it produces feeds the main flow at `/grill-with-docs`; research does not replace the decision work.
- **`/wizard`** — generate an interactive shell guide when a setup, migration, or operational transition contains human-only steps such as opening URLs, capturing values, or placing secrets.
- **`/to-questionnaire`** — turn a decision that needs someone else's input into an asynchronous Markdown questionnaire, after clarifying who will answer and what decision their answers unblock.
- **`/wait-what`** — re-pitch the last message in plain language and the project's Ubiquitous Language when it did not land.
- **`/teach`** — learn a concept over multiple sessions, using the current directory as a stateful workspace.
- **`/writing-for-agents`** — reference for writing and pruning any document an agent consumes, including skills, steering files, plans, and project contracts.
- **`/unslop`** — clean AI tells from any prose while preserving meaning, evidence, project vocabulary, and the author's intended voice. It is the cleanup layer beneath `/writing-for-agents` and every other flow that emits text.
- **`/resolving-merge-conflicts`** — resolve an in-progress merge or rebase conflict by tracing both sides to their intent and completing the operation without discarding either side.

## Fork maintenance

- **`/pi-update`** — maintain the personalized Syn Pi fork. Use it to merge official Pi updates into `syn-pi`, preserve the focused downstream behavior, validate and build it, keep the official `pi` launcher separate, and push the verified non-force update unless local-only work was requested.
- **`/synp-update`** — maintain the personalized Synp fork. Use it to merge upstream Oh My Pi into `main`, preserve the custom fullscreen and smooth-scrolling contract, rebuild the local binary, keep official `omp` separate, retain the `synp` command, and push the verified non-force update unless local-only work was requested.
- **`/skills-fork-update`** — maintain this personalized skills fork. Use it to integrate `mattpocock/skills` changes while preserving DOX direct cutover, the AGENTS fallback, personal/vendor inventory, the teaching kit, and the `mp-code-review` rename. It validates locally and does not push.

## Personal tools

- **`/cmux`** controls local cmux windows, workspaces, panes, focus, and routing; **`/synclaw-server`** runs commands and edits files directly on the Synclaw server.
- The **`/wiki-*`** family imports, ingests, propagates, and health-checks the personal knowledge wiki. Use the source-specific ingest skill when one fits; `/wiki-ingest` is the general entry, `/wiki-digest` propagates claims, and `/wiki-lint` repairs the graph.
- **`/youtube-history-db`** answers evidence-backed questions from the local YouTube history database.

## Precondition

**`/setup-matt-pocock-skills`** — run before your first engineering flow to configure the issue tracker, triage labels, and contract lookup. An existing `dox.config.json` selects canonical DOX records; its absence selects the AGENTS fallback. Custom issue trackers also work.
