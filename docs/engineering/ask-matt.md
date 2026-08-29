## What it does

`ask-matt` is the router over the skills in this repo. You describe the situation you are in, such as an idea you cannot start, incoming bug reports, or a [session](https://www.aihero.dev/ai-coding-dictionary/session) that has run long. It names the skill or sequence that fits and shows where the human decisions in that sequence sit.

It recommends and stops. It does not grill, write a [spec](https://www.aihero.dev/ai-coding-dictionary/spec), retrieve a contract, open a file, or invoke the skill it just named. What you get back is the next thing to type, and you type it. It maps the promoted set plus this fork's maintenance routes, while also pointing at model-invoked contract layers such as `/dox`, `/domain-modeling`, and `/codebase-design`.

## When to reach for it

You invoke this by typing `/ask-matt` — the agent won't reach for it on its own.

| Your situation | What the router gives back |
| --- | --- |
| An idea, and no idea where to start | The head of the main flow, and whether the build is small enough to skip the spec |
| Bugs and requests arriving from other people | The [triage](https://aihero.dev/skills-triage) on-ramp, and why [tickets](https://www.aihero.dev/ai-coding-dictionary/ticket) you generated yourself do not belong on it |
| Two skills that look interchangeable | The concrete boundary between them, such as one session versus many or conversation versus runnable evidence |
| A long session and a decision about the [context](https://www.aihero.dev/ai-coding-dictionary/context) | The ordered tree over the five options at a phase boundary |
| A skill you have already picked | Nothing useful. Invoke that skill directly. |

## Prerequisites

The tracker-dependent routes (`triage`, `to-spec`, `to-tickets`, `implement`, and `wayfinder`) assume [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) has configured the repository's issue tracker and agent pointers.

The stateful planning routes follow this fork's contract storage. Without DOX, resolved language and architectural decisions live in the nearest owning `AGENTS.md`; a decision section that outgrows the hot path graduates to a co-located `DECISIONS.md`. In a repository with `dox.config.json`, DOX records are canonical and no parallel decision ledger is kept.

## Flows, not skills

The leading idea is **flow**: a path through the skills rather than one tool chosen by keywords. Most work runs along one main flow, on-ramps merge into it, and standalones solve one focused problem.

The main idea-to-ship flow is:

```txt
grill-with-docs → to-spec → to-tickets → implement → mp-code-review
```

At the head of that flow, `grill-with-docs` writes settled project context to one canonical store. The trigger is `dox.config.json`: when present, it uses configured DOX records; when absent, it uses the root-to-nearest `AGENTS.md` and `DECISIONS.md` fallback.

Two branches matter inside it:

- If a design question needs runnable evidence, bridge into [prototype](https://aihero.dev/skills-prototype) with [handoff](https://aihero.dev/skills-handoff). The prototype stays as a primary source on a `prototype/<name>` branch outside main, and the implementation issue points to it.
- If the build fits one session, skip `to-spec` and `to-tickets`; invoke `implement` in the conversation that settled the work. For a multi-session build, keep grilling, spec, and ticketing in one unbroken context, then start each ticket in a fresh session.

Three on-ramps join that flow:

- [triage](https://aihero.dev/skills-triage) turns work that arrived from other people into agent-ready issues.
- [diagnosing-bugs](https://aihero.dev/skills-diagnosing-bugs) builds a tight red feedback loop before it theorises about a hard bug.
- [wayfinder](https://aihero.dev/skills-wayfinder) charts a multi-session, foggy effort as decision tickets, then merges back at [to-spec](https://aihero.dev/skills-to-spec) when the map clears.

## Contract layers underneath

Three model-invoked layers run beneath the flows:

- [dox](https://aihero.dev/skills-dox) is the contract retrieval and structural-validation layer triggered by `dox.config.json`. It resolves once when repository work may be governed by recorded context outside the immediate path, then runs one intent-preserving changed-file impact review after substantive content changes. It does not run for external tooling, runtime connectivity checks, Git-only actions, or ordinary follow-ups within the same resolved task.
- [domain-modeling](https://aihero.dev/skills-domain-modeling) adjudicates project language and durable decisions. It updates canonical DOX records and runs `/dox` validation when configured; otherwise it updates the `AGENTS.md` and `DECISIONS.md` fallback.
- [codebase-design](https://aihero.dev/skills-codebase-design) supplies the deep-module vocabulary for module shape, interfaces, seams, leverage, and locality.

## The phase boundary

A **phase boundary** is the gap between chunks of work inside a session. It is the only place to decide what happens to the context. Mid-phase, continue or split tightly scoped work into [subagents](https://www.aihero.dev/ai-coding-dictionary/subagent); compacting mid-phase makes the agent lose the thread.

Work down this table in order. The first option whose condition is true wins.

| Option | Take it when |
| --- | --- |
| **Continue** | The next phase needs this one as a [primary source](https://www.aihero.dev/ai-coding-dictionary/primary-source), or there is enough [smart zone](https://www.aihero.dev/ai-coding-dictionary/smart-zone) left. This move loses nothing, so rule it out first |
| **`/clear`** | Everything behind you is disposable. It is cheap and the old session remains resumable, but clearing relevant context loses the why |
| **[handoff](https://aihero.dev/skills-handoff)** | Something must travel to a new harness, directory, colleague, or side task |
| **Subagent** | The task is scoped tightly enough to run with you [away from the keyboard](https://www.aihero.dev/ai-coding-dictionary/afk) |
| **`/compact`** | Relevant context remains, the harness and directory stay the same, and you need to remain in the loop |

`/compact` is the default, not the first reach. Every move except Continue replaces the session as it happened with a lossy [secondary source](https://www.aihero.dev/ai-coding-dictionary/secondary-source), so the order protects information before it optimises room.

## Standalones and fork routes

The router also covers focused tools outside the main flow:

- [grill-me](https://aihero.dev/skills-grill-me) sharpens an idea without a codebase; [grill-with-docs](https://aihero.dev/skills-grill-with-docs) is the stateful codebase version.
- [`/to-questionnaire`](https://aihero.dev/skills-to-questionnaire) turns a knowledge gap into a document for the person who can answer it.
- [`/wait-what`](https://aihero.dev/skills-wait-what) re-pitches the last message when it did not land, using the project's ubiquitous language.
- [`/wizard`](https://aihero.dev/skills-wizard) builds a guided shell procedure for manual setup, secrets, migrations, or cutovers that only a human can perform.
- [`/writing-for-agents`](https://aihero.dev/skills-writing-for-agents) is the reference for skills, `AGENTS.md`, specs, prompts, and other agent-facing text.
- [`/unslop`](https://aihero.dev/skills-unslop) is the prose cleanup layer beneath every flow that emits text; it removes AI tells without changing evidence or project vocabulary.
- [research](https://aihero.dev/skills-research) delegates reading against primary sources; [teach](https://aihero.dev/skills-teach) builds a multi-session learning workspace.
- [resolving-merge-conflicts](https://aihero.dev/skills-resolving-merge-conflicts) handles the merge or rebase already in progress.

This personalized fork adds routes that do not belong to the promoted product-development map:

- `/cmux` controls local cmux windows, workspaces, panes, focus, and routing; `/synclaw-server` runs commands and edits files directly on the Synclaw server.
- The `/wiki-*` family handles the personal knowledge wiki. `/wiki-import-readwise` dispatches Readwise imports, `/wiki-ingest` and its source-specific variants capture material, `/wiki-digest` propagates claims, and `/wiki-lint` checks and repairs the graph.
- `/youtube-history-db` answers evidence-backed questions from the local YouTube history database.
- `/pi-update` maintains the Syn Pi fork. `/skills-fork-update` integrates upstream skills changes while preserving DOX direct cutover, the AGENTS fallback, personal and vendor inventory, and the `/mp-code-review` rename.

## Common questions

**Isn't there just a list of the skills in the right order?**

The chain above is the common route, but a static list misses the decisions that matter: whether there is a codebase, whether the effort spans sessions, and whether a question can be settled by talking. Ask for the compressed sequence when that is all you need; use the router when the branch is the question.

**It described a skill's behaviour, and the skill does not do that.**

The router is a hand-maintained [secondary source](https://www.aihero.dev/ai-coding-dictionary/secondary-source) over each `SKILL.md`. When a claim is load-bearing, ask it to read that skill's source before relying on the summary. The source is right when the two disagree.

**Can it route over my own unrelated skills?**

No. It maps this repository's promoted set and the explicit fork-local maintenance routes above. It does not scan an arbitrary local skills directory.

**Where did an older name go?**

Check the changelog before assuming a skill disappeared. `writing-great-skills` became [writing-for-agents](https://aihero.dev/skills-writing-for-agents), `to-prd` became [to-spec](https://aihero.dev/skills-to-spec), `pathfinder` became [wayfinder](https://aihero.dev/skills-wayfinder), and this fork uses [mp-code-review](https://aihero.dev/skills-mp-code-review) everywhere.

## It's working if

- It ends by naming what to type and stops there instead of starting the work itself.
- The route mentions where to continue, clear, hand off, delegate, or compact, not just a list of names.
- Where two skills are close, it says which one fits and why the other does not.
- A claim about another skill's behaviour is grounded in that skill's `SKILL.md` when the choice depends on it.
- The route names `dox.config.json` when contract storage affects the flow, and never combines DOX with the AGENTS fallback.

## Where it fits

`ask-matt` is a **standalone router** over the whole set. It is never a step in a chain; it points into every chain, and it is the node the other docs pages link back to so none of them has to redraw the graph. From here you most often land on [grill-with-docs](https://aihero.dev/skills-grill-with-docs), the head of the main flow, or [triage](https://aihero.dev/skills-triage), the on-ramp for work that arrived rather than work you started.
