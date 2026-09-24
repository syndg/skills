## What it does

`to-spec` turns settled discussion into one **[spec](https://www.aihero.dev/ai-coding-dictionary/spec)** issue with the approved requirements, decision rationale, and a detailed implementation plan grounded in the code.

It synthesises what you already decided without restarting the interview. The issue is the handoff to a fresh implementation [session](https://www.aihero.dev/ai-coding-dictionary/session), whether the change is small or large. It does not implement the plan or split it into sub-issues.

## When to reach for it

You invoke this by typing `/to-spec`. The [agent](https://www.aihero.dev/ai-coding-dictionary/agent) won't reach for it on its own.

| Where you are | What to run |
| --- | --- |
| You want to preserve settled discussion for a fresh implementation session | `/to-spec`, then [implement](https://aihero.dev/skills-implement) with the issue reference |
| You already have the spec issue | `/to-spec <issue-reference>` updates it rather than creating a duplicate |
| You haven't settled the consequential decisions | [grill-with-docs](https://aihero.dev/skills-grill-with-docs) first |
| A [wayfinder](https://aihero.dev/skills-wayfinder) map has cleared | `/to-spec #<map_issue>` reads its linked decisions and preserves the map and decision history. It creates one linked spec, or updates an already identified spec |
| You want a source issue itself to become the spec | Explicitly request conversion; supplying a map or decision issue alone does not authorize it |
| You explicitly want separately tracked slices | [to-tickets](https://aihero.dev/skills-to-tickets) proposes a breakdown for your approval before publishing |

## Prerequisites

[setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) must have configured the issue tracker and triage-label vocabulary for this repo. Remote trackers such as GitHub or GitLab hold the issue without a local plan mirror. A configured local tracker uses its existing file convention.

Configured repositories follow [dox](https://aihero.dev/skills-dox)'s retrieval and reuse policy for project meaning. Without DOX, the skill uses the applicable root-to-nearest `AGENTS.md` chain and relevant indexed co-located `DECISIONS.md` entries.

## One issue, two kinds of detail

The issue body is the current feature contract. It captures the requirements you approved, acceptance criteria, decisions from [grilling](https://www.aihero.dev/ai-coding-dictionary/grilling), their rationale and sources, and what you ruled out. A fresh session should not need the planning conversation to recover any of that.

The ordered implementation plan is separate. It names the paths, symbols, callers, and verification points the planning session inspected, along with the repository revision. Proposed implementation details are not silently promoted into requirements. The implementer checks those references against the current checkout before editing.

Comments hold progress, deviations, approvals, and review history. When you approve a requirement change, the body changes too. An agent's suggestion in a comment is not permission to change scope. Durable domain and architectural meaning still belongs in the selected project-contract store rather than a competing issue-based ledger.

## Seams and readiness

`to-spec` reuses agreed **seams** for testing. Where a choice remains, it prefers an existing seam at the highest useful level and asks only about the unresolved choice. It does not ask you to approve the same seam twice.

Readiness depends on approval, not on whether an issue was published:

- Explicit approval of the current requirements and consequential decisions, a complete plan and verification approach, and no consequential open questions allow the configured `ready-for-agent` label.
- Missing approval or unresolved consequential choices leave the issue in an appropriate configured non-ready state, with the blockers written down.

Approval from the existing discussion counts. Typing `/to-spec` does not count as approval of decisions the agent adds while writing.

## Common questions

**Can I plan in one session and implement in a fresh one from a single GitHub issue?**
Yes. The issue contains the approved spec and the ordered, code-grounded plan. Start the new session with `/implement <issue-url>` once the issue is ready. You do not need a local plan file or an intermediate decomposition step.

**Does a large spec have to become sub-issues?**
No. Size does not change the default of one issue. Use `/to-tickets` only when you want separate tracked slices and their blocking edges.

**Will it restart grilling or ask me to approve everything again?**
No. It carries settled decisions and existing approvals forward. It asks only about remaining test seams or consequential approval, and keeps unresolved choices visible rather than guessing.

**What if the code changes after planning?**
The plan records the inspected revision and verified paths and symbols. The implementation session rechecks them. A stale path may need a different implementation step; it does not authorize changing the approved behavior.

**Where did `/to-prd` go?**
It was renamed to `/to-spec` in v1.1. The spec now provides the direct handoff to implementation; a separate breakdown remains optional.

## It's working if

- You get one issue reference and a fresh-session handoff, with no surprise sub-issues.
- The issue distinguishes approved requirements from proposed implementation choices.
- Its ordered plan points to inspected code and names the revision used.
- Settled decisions keep their rationale; unresolved ones remain visible and prevent false readiness.
- An existing spec issue is updated, and approved requirement changes appear in its body rather than only in comments.
- Source maps and decision issues retain their history, with links from the spec, unless you explicitly requested conversion.

## Where it fits

`to-spec` is the handoff step between planning with [grill-with-docs](https://aihero.dev/skills-grill-with-docs) and a fresh [implement](https://aihero.dev/skills-implement) session. That implementation session owns verification and repairs and directly runs [mp-code-review](https://aihero.dev/skills-mp-code-review). [to-tickets](https://aihero.dev/skills-to-tickets) is an explicit alternative when you want decomposition, not a required step. [ask-matt](https://aihero.dev/skills-ask-matt) routes you when you're unsure which flow fits.
