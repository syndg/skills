## What it does

`to-tickets` takes a plan, a [spec](https://www.aihero.dev/ai-coding-dictionary/spec), or the conversation you are in, and breaks it into a set of **[tickets](https://www.aihero.dev/ai-coding-dictionary/ticket)** on your issue tracker. Each ticket declares its **blocking edges**, the other tickets that have to finish before it can start. This is an explicit opt-in: a small or large spec otherwise stays one issue.

Every ticket is a **tracer bullet**: a narrow but complete path through every layer of the change (schema, API, UI, tests) that you can demo on its own as soon as it lands. This is what makes the skill different from the obvious way to split work, which is to cut one layer at a time and integrate at the end. It also sizes each ticket to fit in a single fresh [context window](https://www.aihero.dev/ai-coding-dictionary/context-window), because a [session](https://www.aihero.dev/ai-coding-dictionary/session) that has never seen your spec will pick the ticket up.

Configured repositories follow [dox](https://aihero.dev/skills-dox)'s retrieval and reuse policy for planning. An existing conversation's applicable meaning can carry into the breakdown. Without DOX, the skill uses the root-to-nearest `AGENTS.md` chain and relevant indexed co-located `DECISIONS.md` entries.


## When to reach for it

You invoke this by typing `/to-tickets`. The [agent](https://www.aihero.dev/ai-coding-dictionary/agent) won't reach for it on its own, and the size of the work is not a reason to invoke it automatically.

| Where you are | What to run |
| --- | --- |
| You have a spec and explicitly want separately tracked slices | `/to-tickets`, or `/to-tickets #<spec_issue>` |
| The plan is only in the conversation and you want a breakdown | `/to-tickets` reads the thread directly; no spec needed |
| You want a fresh session to implement one issue, whatever its size | [to-spec](https://aihero.dev/skills-to-spec), then [implement](https://aihero.dev/skills-implement) |
| Nothing is decided yet | [grill-with-docs](https://aihero.dev/skills-grill-with-docs), then [to-spec](https://aihero.dev/skills-to-spec) |
| A [wayfinder](https://aihero.dev/skills-wayfinder) map has cleared | [to-spec](https://aihero.dev/skills-to-spec) first; choose `/to-tickets` only if you want a breakdown |

Tickets that `to-tickets` produced are agent-ready by construction. Don't run [triage](https://aihero.dev/skills-triage) over them — triage is for work that arrived from someone else.

## Prerequisites

`to-tickets` publishes into a tracker, so [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) must have configured one for this repo, along with the triage-label vocabulary. Either kind works: a remote tracker like GitHub, GitLab, or Linear, or local markdown files under `.scratch/`, which work with no extra setup.

## Tracer bullets, not layers

A **horizontal** slice ships one layer of the change. Nothing works until every layer has landed, and each ticket's acceptance criteria have to reach into work that another ticket owns. A **vertical** slice — the tracer bullet — ships one thin path through all the layers at once, so it is verifiable alone and owns everything it grades.

This is the rule people break most often. One team ran a 26-ticket stack sliced by layer (corpus, producer, aggregator, selector) and got roughly twenty agent runs per closed ticket, about three quarters of them rework. Their own post-mortem traced every failure class back to the horizontal slicing rather than to the implementations.

Two things happen before anything is published. `to-tickets` looks for prefactoring — "make the change easy, then make the easy change" — and orders that work first. Then it presents the breakdown as a numbered list and quizzes you on it: is the granularity right, are the blocking edges real, should anything merge or split. Nothing reaches the tracker until you approve, and that quiz is the place to push back.

## Blocking edges

The edges are the point of the artifact. They work in two ways, depending on the tracker:

| Tracker | Where the edges live | How you work them |
| --- | --- | --- |
| Local markdown | Text in one file per ticket under `.scratch/<feature>/issues/<NN>-<slug>.md`, numbered blockers-first | Top to bottom, by hand |
| A remote tracker (GitHub, GitLab, Linear) | Native blocking links or sub-issue relationships where supported, with body text as the fallback | Any ticket whose blockers are done is on the **frontier** and can be grabbed |

The edges live in the ticket either way. Remote issues stay on the tracker without local plan mirrors. The tracker only decides whether anything can act on them in parallel. `to-tickets` publishes the approved breakdown; running it, one session at a time or as a fleet, is your job, not the skill's. The skill does not close or rewrite the parent spec.

## The wide-refactor exception

One shape breaks the tracer-bullet rule. A **wide refactor** is a single mechanical change (rename a column, retype a shared symbol) whose **blast radius** covers the whole codebase. One edit breaks thousands of call sites, so no vertical slice can land green.

`to-tickets` sequences that as **expand–contract** instead:

- **Expand** — add the new form beside the old, so nothing breaks.
- **Migrate** — move call sites over in batches sized by blast radius (per package, per directory), one ticket per batch, each blocked by the expand. CI stays green because the old form still exists.
- **Contract** — delete the old form once no caller remains, in a ticket blocked by every migrate batch.

Where even the batches can't stay green alone, they share an integration branch and all block a final integrate-and-verify ticket. CI only has to be green at that ticket.

## Common questions

**It produced twelve tickets for a three-line change.**
Over-decomposition is the most reported problem with this skill. The [model](https://www.aihero.dev/ai-coding-dictionary/model) defaults to atomic units and loses the grouping that would make them meaningful. The quiz step is where you fix this: ask it to merge tickets, and it will. If the whole change fits in one context window, you don't need this skill at all. Go straight to [implement](https://aihero.dev/skills-implement).

**Do I need tickets because my spec is large?**
No. One issue is the default for small and large changes. Choose this skill when you want separately tracked slices. It still presents the breakdown for approval before publishing, so you can merge an over-decomposed proposal or reject it altogether.

**The tickets came out one per layer: all the schema in one, all the API in another.**
This is the failure the vertical-slice rule is written against, and the skill still produces it sometimes. Catch it at the quiz step by asking one question per ticket: what can I demo when this is done? A ticket with no answer is a horizontal slice. Some people add a "demo path" line to each ticket for this reason, and report that it pushes the model toward vertical decomposition.

**On GitHub the tickets weren't created as sub-issues of the spec issue.**
Missing parent links have been [reported in issue #554](https://github.com/mattpocock/skills/issues/554). The skill calls for native relationships where the tracker supports them. Check the published relationships, not just the parent reference in the body.

**"Blocked by" was written into the issue body instead of a real blocking link.**
This has been [reported in issue #513](https://github.com/mattpocock/skills/issues/513). GitHub supports native blocking relationships. Because blockers are published first, their identifiers are available when dependent issues are created. Body text is the fallback for trackers without native edges, not the default.

**Where do the local tickets go? The v1.1 notes said a root-level `tickets.md`.**
They did, and that was a bug. A single shared file also caused race conditions when parallel agents wrote to it. Local mode now writes one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, in dependency order, matching the layout the local tracker template already described. The `NN` prefix is a real ticket ID, so `/implement 03` works instead of retyping a long title.

**Can I start from the spec in a fresh session?**
Yes. Pass its issue reference. The skill reads the body and comments rather than depending on the planning conversation. A remote spec has no local mirror, so an incomplete tracker response still needs to be resolved before the agent can produce a reliable breakdown.

**The acceptance criteria graded nothing: some passed before any work was done.**
The template asks for criteria and says nothing about whether they can fail, so this happens. Three shapes recur: a criterion already true at the base commit, a criterion that can only be satisfied by work another ticket owns, and one that restates the request rather than deriving from the artifact. Vertical slicing prevents most of it, because a slice that delivers new behaviour fails at the base commit by construction. The check is worth doing by hand. For each criterion, name the observation that would show it false, and confirm it fails at the commit the implementer starts from.

**The tickets are published. How do I actually run them?**
The skill stops at the artifact, and it does not dispatch implementation. Work the frontier by passing each unblocked issue to [implement](https://aihero.dev/skills-implement) in a fresh session, or run the whole task graph with [implement-spec](https://aihero.dev/skills-implement-spec). That session owns implementation, verification, repairs, and the direct [mp-code-review](https://aihero.dev/skills-mp-code-review) run. Check issue status before starting dependent work.

## It's working if

- Every ticket has an answer to "what can I demo when this is done?" — and the answer is behaviour, not a layer.
- The list comes back to you numbered, with a "Blocked by" line on each, before anything is published.
- The ticket at the top has no blockers and can be started immediately.
- Nothing in a ticket body is a file path or a line number, except a snippet a prototype produced.
- Each ticket reads like something a fresh session could finish without you in the room.
- Prefactoring, where it found any, is at the front of the order rather than mixed into feature tickets.

## Where it fits

`to-tickets` is an optional decomposition step, not the default next step after planning. [to-spec](https://aihero.dev/skills-to-spec) normally hands one approved issue directly to a fresh [implement](https://aihero.dev/skills-implement) session.

```txt
grill-with-docs → to-spec → to-tickets → implement → mp-code-review → retro
```

When you explicitly want a breakdown, `to-tickets` publishes approved slices and their blocking edges, and `implement` builds them from the frontier. Upstream is [to-spec](https://aihero.dev/skills-to-spec), which hands it a settled spec to slice against. Keep both in one context window, with no clear between them. Downstream is [implement](https://aihero.dev/skills-implement), which builds one ticket per fresh session, driving [tdd](https://aihero.dev/skills-tdd) for the tests and running [mp-code-review](https://aihero.dev/skills-mp-code-review). [implement-spec](https://aihero.dev/skills-implement-spec) is the other way down. It reads the same blocking edges as a task graph and builds every ready ticket in parallel on one integration branch. When you're unsure which skill or flow fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
