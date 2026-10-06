## What it does

`implement` turns an approved [spec](https://www.aihero.dev/ai-coding-dictionary/spec) or explicit issue scope into verified code, then owns the independent review and repair loop. One spec issue can carry the whole feature. Splitting it into smaller issues is your choice, not a prerequisite imposed by the skill.

The implementation [session](https://www.aihero.dev/ai-coding-dictionary/session) keeps responsibility for edits and runtime verification. It calls [mp-code-review](https://aihero.dev/skills-mp-code-review) directly for separate Standards and Spec reviews, fixes evidenced defects, and requests re-review after repairs. Review happens before the final commit and includes uncommitted work.

## When to reach for it

You invoke this by typing `/implement`. The agent will not reach for it on its own, and other skills can recommend it but cannot invoke it for you.

| What you have | What to do |
| --- | --- |
| An approved spec issue for a whole feature | Start a fresh session and pass its full URL to `/implement` |
| An explicitly scoped issue or set of issues | Pass those references and the intended scope |
| A local spec | Pass its path directly; no tracker setup or issue splitting is required |
| An agreed plan in the current conversation | Tell `/implement` to use that plan |
| Requirements that still need decisions | Use [grill-with-docs](https://aihero.dev/skills-grill-with-docs) before implementation |
| Code that only needs review | Use `mp-code-review` directly |

A full issue URL is the clearest reference in a fresh session. A bare number also works when the repository and issue tracker make its identity unambiguous. The skill resolves the source and title before editing instead of treating the number as an entry in an unrelated list.

## Prerequisites

Use the checkout and branch where you want the work to happen. The skill records HEAD and the starting staged, unstaged, and untracked state so it can distinguish its changes from yours. Shared files need hunk-level ownership; an ambiguous boundary needs a decision before that part is edited.

Choose the implementation [model](https://www.aihero.dev/ai-coding-dictionary/model) in your environment before starting. Name a review model in your request, or use the project's preference. An explicit user choice takes precedence. Without either, `mp-code-review` uses its standalone defaults. Writing a model name in a prompt does not make the environment capable of routing to it.

For tracker-based work, the session needs access to the issue body and relevant comments through the project's tracker workflow. GitHub, GitLab, and existing local spec workflows remain supported. Remote issues stay in the tracker rather than acquiring local plan mirrors.

## The issue is the handoff

A fresh implementation session should not need the planning conversation. The issue body carries the current approved requirements, settled decisions and rationale, an ordered implementation plan grounded in the repository, and acceptance and verification criteria. Comments carry progress, deviations, and reviews. Approved requirement changes go back into the body so the next session does not have to reconstruct the current scope from a comment thread.

The plan is useful, but its file paths and implementation assumptions can go stale. `implement` checks them against current code before following them. It can adapt an implementation detail while preserving the approved behavior. A scope change, changed acceptance criterion, or dispute about settled design goes back to you.

In a configured repository, [dox](https://aihero.dev/skills-dox) owns contract retrieval, reuse across implementation and review, and maintenance. Without DOX, the skill uses the applicable root-to-nearest `AGENTS.md` chain and indexed co-located `DECISIONS.md` entries. Neither route turns the issue into a second repository-contract ledger.

## Independent review, owned repairs

The implementation session uses [tdd](https://aihero.dev/skills-tdd) where appropriate at agreed seams, keeps the project's checks, and exercises changed behavior in the runtime. Its evidence says what actually ran and which acceptance criteria it demonstrates. An unrun check stays visible. Nothing inside `implement` agrees the seams; `tdd` is the skill that asks, so naming the seams in the spec is what keeps the run from becoming "just write the code".

`mp-code-review` receives the same approved requirements snapshot for both axes, the fixed baseline, precise owned changes and exclusions, the review-model preference, and verification evidence. It owns reviewer routing and independent contexts. There is no intermediary review coordinator and no replacement of independent review with the implementer's self-review.

Standards and Spec findings stay separate. The implementation session repairs evidenced in-scope defects and reruns the affected checks, then requests the relevant independent re-review. It brings contract changes and design disputes to you rather than quietly changing what counts as success.

Completion includes an evidence-backed status report. Tracker-based work also gets an issue comment with verification results, deviations, review outcomes, and any blockers. A commit or issue closure needs authorization from you or the repository workflow after the required gates pass. Neither implies a push or pull request.

## Common questions

**Can I plan with one model, then implement the whole issue in a fresh session with another?**

Yes. Publish the approved plan in one spec issue, choose the implementation model in your environment, then invoke `/implement` with that issue's URL. You can also designate the planning model for both independent review axes. The skill carries that preference to `mp-code-review`; the environment must actually support the requested routing.

**Do I need to create sub-issues first if the feature is large?**

No. The default scope is the entire spec. Use [to-tickets](https://aihero.dev/skills-to-tickets) only when you explicitly want separate issues. `implement` does not invoke that user-only skill or silently narrow the work to a smaller slice. For a spec that was split into tickets, `implement` takes one ticket per run. [implement-spec](https://aihero.dev/skills-implement-spec) runs the whole task graph in one pass, giving each ticket on the ready frontier to a [subagent](https://www.aihero.dev/ai-coding-dictionary/subagent) in its own worktree and merging the results onto one integration branch. Running several `/implement` sessions side by side in one checkout is worse than unsupported: they share one working directory, one index, and one HEAD, so commits, amends, and stashes can land on the wrong session's work.

**What happens if the requested review model is unavailable?**

The review is blocked, not passed. `mp-code-review` supplies portable briefs for separate independent review sessions, and the implementation session resumes its repair loop when those reports are available. It does not silently substitute a different model or review its own work to satisfy the gate.

**Does it open a pull request?**

No. A commit needs authorization and implies neither a push nor a pull request. Ask for one in the invocation. When the agent writes the PR, [pr](https://aihero.dev/skills-pr) shapes its body.

**Must I commit before reviewers can see the changes?**

No. The review input includes owned staged, unstaged, and untracked changes, along with any explicitly in-scope commits. Pre-existing user work is excluded. The final commit comes after verification and review, and only when authorized; otherwise the reviewed changes stay uncommitted.

Some people do not want the review inside the run at all, because an agent reviewing the code it just wrote is biased toward its own solution. The review here is done by independent read-only contexts, not by the implementer. Running [mp-code-review](https://aihero.dev/skills-mp-code-review) in a fresh session against a fixed point is also a valid alternative.

**One run burned 150k tokens. Am I using it wrong?**

Probably not. The scope is more likely too big. A run does codebase exploration, a red-green loop per seam, a full suite, and a review, so a non-trivial ticket exceeding 100k [tokens](https://www.aihero.dev/ai-coding-dictionary/token) is normal rather than a sign something broke. The fix is upstream. Right-size the work upstream: if one scope keeps going over, split it (with [to-tickets](https://aihero.dev/skills-to-tickets), if you explicitly want that) rather than raising the [effort](https://www.aihero.dev/ai-coding-dictionary/effort) level.

**`/implement #2` in a fresh session worked on something completely unrelated.**

The agent resolves `#2` against whatever numbered list it can see. In a fresh session that may be a todo file, a checklist, or another work list rather than the configured tracker. The agent does not stop when the match is uncertain, so the mistake is not obvious until the work has started. Pass the full reference, the issue URL or `owner/repo#2`, and ask it to confirm the title back before it begins.

## It's working if

- A fresh session identifies the right issue and title, reads its body and relevant comments, and starts from the approved scope.
- The review covers the actual uncommitted implementation without sweeping in your earlier edits.
- You see separate Standards and Spec reports, followed by repairs and relevant re-review rather than an unexplained claim that everything passed.
- Missing runtime evidence or unavailable review routing remains visible as a blocker.
- The issue comment records actual results and deviations, and any commit contains only the authorized work.

## Where it fits

`implement` is the execution step after [to-spec](https://aihero.dev/skills-to-spec), which gives a fresh session its approved scope. It calls `mp-code-review` within the same implementation session because review findings need an owner who can repair and verify the code. `to-tickets` is an optional branch chosen by the user, not a mandatory stop between planning and implementation. After a build, especially one that went sideways, [retro](https://aihero.dev/skills-retro) looks back over the session and suggests changes to the agent's environment.

[ask-matt](https://aihero.dev/skills-ask-matt) maps this workflow to the rest of the skills.
