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
3. **Branch — is this a multi-session build?**
   - **Yes** → **`/to-spec`** (turn the thread into a spec), then **`/to-tickets`** to split it into tracer-bullet tickets, each declaring its **blocking edges**. On a local tracker that's one file per ticket under `.scratch/<feature>/issues/`, worked blockers-first by hand; on a real tracker the edges become native blocking links, so any ticket whose blockers are done can be grabbed — kick off **`/implement`** per ticket, **clearing context between each one**.
   - **No** → **`/implement`** right here, in the same context window.

   Either way, **`/implement`** builds each issue by driving **`/tdd`** internally — one red-green slice at a time — then closes out by running **`/mp-code-review`**, a two-axis review (Standards + Spec) of the diff, before committing. Reach for **`/tdd`** on its own when you just want to build a concrete behaviour test-first without a full spec, and **`/mp-code-review`** on its own whenever you want to review a branch or PR against a fixed point.

### Phase boundaries

Keep steps 1–3 in one session whenever the next phase needs the current conversation as a primary source. At every genuine phase boundary, use the ordered decision tree in [PHASE-BOUNDARIES.md](./PHASE-BOUNDARIES.md): continue when the reasoning still matters and there is room; `/clear` when it does not; `/handoff` only when the context must travel; use a subagent for scoped AFK work; otherwise `/compact` with an instruction for the next phase. Do not compact mid-phase.

## On-ramps

A starting situation that generates work, then merges onto the main flow.

- **Bugs and requests piling up** → **`/triage`**. It moves issues through triage roles and produces agent-ready issues, which **`/implement`** later picks up.

  Triage is only for issues **you didn't create** — bug reports, incoming feature requests, anything that arrives raw. Tickets that `/to-tickets` produced are already agent-ready, so **don't triage them**.

- **Something's broken** → **`/diagnosing-bugs`**. For the hard ones: the bug that resists a first glance, the intermittent flake, the regression that crept in between two known-good states. It refuses to theorise until it has a **tight feedback loop** — one command that already goes red on *this* bug — then fixes with a regression test. After the fix, recommend **`/improve-codebase-architecture`** when the real finding is that there is no good seam to lock the bug down.

- **A huge, foggy effort — a greenfield project or a huge feature build, too big for one session** → **`/wayfinder`**, the most cognitively demanding flow here. When the way from here to the destination isn't visible yet, it charts a **shared map** of **decision tickets** on the issue tracker and resolves them one at a time — producing **decisions, not deliverables** — until the fog is pushed back and the way is clear. Where **`/grill-with-docs`** sharpens an idea you can hold in one session, wayfinder is for the idea you can't — and it's slower and denser, so save it for exactly that, never a well-scoped feature.

  When the map clears, **it hands off, it doesn't build**: merge onto the main flow at **`/to-spec`**, which collapses the map's linked decisions into a buildable plan, then `/to-tickets` and `/implement` as usual. Looping the map straight into `/implement` skips that collapse and throws the linked detail away — go straight to `/implement` only when the effort turned out genuinely small.

## Codebase health

Not feature work — upkeep.

- **`/improve-codebase-architecture`** — run whenever you have a spare moment to keep the codebase good for agents to operate in. It surfaces **deepening opportunities**; picking one _generates an idea_ you can take into the main flow at `/grill-with-docs`. It's the survey that finds the candidates; **`/codebase-design`** (below) is the bench you design the chosen one on.

## Contract layers underneath

Three model-invoked layers run *beneath* the other skills. They retrieve or maintain the contracts that make a flow coherent. Reach for them directly when the contract, words, or module shape is the problem; or let the skills above pull them in.

- **`/dox`** — the automatic contract-retrieval and structural-validation layer when `dox.config.json` is present. It runs before repository research or code work, including read-only tasks. Give it one task plus known paths or changed files; it returns compact resolved items and a local receipt for explicit full-body expansion.
- **`/domain-modeling`** — the semantic-adjudication layer for the project's domain language. It challenges fuzzy terms and decides whether a hard-to-reverse choice deserves a durable record. With `dox.config.json`, it updates canonical DOX records and runs `/dox` validation. Without that file, it uses the root-to-nearest `AGENTS.md` and `DECISIONS.md` fallback.
- **`/codebase-design`** — the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality) for designing a module's *shape*: a lot of behaviour behind a small interface at a clean seam. `/tdd` and `/improve-codebase-architecture` both speak it.

## Crossing sessions

- **`/handoff`** — create a portable Markdown context when the work must move to a new harness, directory, repository, colleague, or a side task found mid-phase. Portability is the reason to use it; a merely full context window normally lands on `/compact`.
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
- **`/skills-fork-update`** — maintain this personalized skills fork. Use it to integrate `mattpocock/skills` changes while preserving DOX direct cutover, the AGENTS fallback, personal/vendor inventory, the teaching kit, and the `mp-code-review` rename. It validates locally and does not push.

## Personal tools

- **`/cmux`** controls local cmux windows, workspaces, panes, focus, and routing; **`/synclaw-server`** runs commands and edits files directly on the Synclaw server.
- The **`/wiki-*`** family imports, ingests, propagates, and health-checks the personal knowledge wiki. Use the source-specific ingest skill when one fits; `/wiki-ingest` is the general entry, `/wiki-digest` propagates claims, and `/wiki-lint` repairs the graph.
- **`/youtube-history-db`** answers evidence-backed questions from the local YouTube history database.

## Precondition

**`/setup-matt-pocock-skills`** — run before your first engineering flow to configure the issue tracker, triage labels, and contract lookup. An existing `dox.config.json` selects canonical DOX records; its absence selects the AGENTS fallback. Custom issue trackers also work.
