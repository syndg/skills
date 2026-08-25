---
"mattpocock-skills": patch
---

Add the `implement-spec` skill (in-progress bucket, user-invoked). It takes a spec and its tickets and drives them to a single PR: the tickets are read as a task graph with blocking edges, so implementer subagents run in isolated worktrees across the ready frontier, a merger subagent folds each one back into the PR branch, and the flow closes with `/mp-code-review` before the PR is marked ready.
