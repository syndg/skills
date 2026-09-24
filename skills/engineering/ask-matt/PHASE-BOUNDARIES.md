# Phase boundaries

A **phase** is a chunk of work inside a session — the grilling, the implementation, the QA. The definition is fuzzy on purpose: a phase ends when you think *"ok, we're done with that"*.

The **phase boundary** is the gap between two phases, and it is the only place this decision belongs. Mid-phase there is no decision to make — continue, or split the work that's left into subagents. Compacting mid-phase makes the agent lose the thread.

## Planned-work handoff

Keep grilling and `/to-spec` in the planning session until the approved issue contains the requirements, settled decisions and rationale, detailed plan, and acceptance and verification criteria. Then start a fresh `/implement` session with that issue's URL, or its file path for a configured local tracker. The issue already carries the handoff; remote tracker work needs no duplicate local Markdown file.

The human selects planning and implementation models in the environment and designates the review model. Skills do not switch models. `/implement` directly runs `/mp-code-review` before the final commit; that skill owns independent Standards and Spec dispatch and the separate-session fallback when required routing is unavailable.

This deliberate session boundary takes precedence over the tree below. A large build can stay in one spec issue; `/to-tickets` is an explicit human choice, not a response to session count.

## The five options

| Option       | What it does                                                    |
| ------------ | --------------------------------------------------------------- |
| **Continue** | Stay in the session. No context switch at all.                    |
| **`/clear`** | Empty the context window and start from nothing.                  |
| **`/handoff`** | Write a portable markdown file and seed a session anywhere with it. |
| **Subagent** | Send the task to its own context window and get a report back.     |
| **`/compact`** | Compress this context and seed a fresh session with the summary.  |

## The tree

Work top to bottom at the boundary. The first **yes** wins.

**1. Can you continue in this session?** Two things make the answer yes: the next phase needs this phase as a **primary source**, or you have enough [smart zone](https://www.aihero.dev/ai-coding-dictionary/smart-zone) left (~150k tokens) for the next phase to fit. Grilling → `/to-spec` is the standard yes: the spec needs the reasoning before it becomes the durable handoff. Continue costs nothing and loses nothing, so rule it out before anything else.

**2. Is the context irrelevant to what comes next?** Is everything in this session — the exploration, the decisions, the dead ends — disposable? If so, **`/clear`**. It is the cheapest move on the board: it takes no time and hands back the whole window. `/clear` also isn't terminal — the old session stays resumable.

The cost of getting this wrong is one-way. Clear a *relevant* context and you lose the **why** behind what you built, and no amount of reading the diff back gets it returned.

**3. Do you need to hand off?** Use an existing approved issue when it carries the needed context. `/handoff` creates a portable file only when that context is missing from an existing artifact and you are:

- swapping to a **new harness** (Claude → Codex),
- moving to a **new directory** or repo,
- sending the work to a **colleague**,
- or forking a side task you found **mid-phase** without derailing what you're doing.

What `/handoff` buys is portability when no existing artifact does the job. Moving between sessions or environments does not itself require another file.

**4. Can the task be done AFK?** Is it scoped tightly enough to run with you away from the keyboard, no steering? Then send it to a **subagent** and leave this session untouched. Independent review is a common case; use `/mp-code-review` for its review contexts, designated-model routing, and portable fallback rather than treating implementer self-review as equivalent.

**5. Otherwise, `/compact`.** Relevant context, same harness, same directory, and you need to stay in the loop — this is where the tree lands, and it lands here often. Pass it an instruction (`/compact we're going to QA this area`) so the summary keeps what the next phase needs.

`/compact` is the **default, not the first reach**. It sits at the bottom because the four questions above it are all cheaper or more precise. The failure mode when people start here is a fresh session that is confidently wrong about a decision the summary flattened.

## Primary and secondary sources

Summarising a session replaces a **primary source** with a **secondary source**. An approved spec issue is different: its body is the canonical current requirements, with the decisions and rationale needed for implementation. For conversation context that has not been captured in that approved artifact, the trade is:

| Source                            | Information | Noise | Room to move |
| --------------------------------- | ----------- | ----- | ------------ |
| Primary (Continue)                | Full        | Lots  | Little       |
| Secondary (`/compact`, `/handoff`) | Lossy       | Less  | Lots         |

This is why question 1 comes first. You only pay the lossiness when staying costs more than it saves.

## These are judgement calls

The questions are not objective — each has taste in it, and the same boundary can go two ways on two days. The value is in asking them **in order**, at the boundary rather than in the middle of the work.
