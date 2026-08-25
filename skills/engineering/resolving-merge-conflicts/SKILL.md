---
name: resolving-merge-conflicts
description: "Use when you need to resolve an in-progress git merge/rebase conflict."
---

1. **See the current state** of the merge/rebase. Identify the conflicting files and the commits or branches being combined.

2. **Resolve contract context before researching or editing the conflicts.** If `dox.config.json` exists, invoke `/dox` with one conflict-resolution task and every conflicting path, then use its compact resolved items for targeted history and source inspection. Treat that as a direct cutover: do not enumerate DOX records or also read `AGENTS.md`. Without DOX, read the applicable `AGENTS.md` chain from the repo root to each conflict's nearest owner and any relevant co-located `DECISIONS.md` entries those chains index when project contract context is needed.

3. **Find the primary sources** for each conflict. Understand deeply why each change was made, and what the original intent was. Read the commit messages, check the PRs, check original issues/tickets.

4. **Resolve each hunk.** Preserve both intents where possible. Where incompatible, pick the one matching the merge's stated goal and note the trade-off. Do **not** invent new behaviour. Always resolve; never `--abort`.

5. Discover the project's **automated checks** and run them — typically typecheck, then tests, then format. Fix anything the merge broke.

6. **Finish the merge/rebase.** Stage everything and commit. If rebasing, continue the rebase process until all commits are rebased.
