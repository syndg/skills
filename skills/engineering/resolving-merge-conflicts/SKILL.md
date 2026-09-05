---
name: resolving-merge-conflicts
description: "Use when you need to resolve an in-progress git merge/rebase conflict."
---

1. **See the current state** of the merge/rebase. Identify the conflicting files and the commits or branches being combined.

2. **Select contract context.** When `dox.config.json` exists, follow the installed `/dox` skill for retrieval eligibility, context reuse, and maintenance of the conflicting paths. Without DOX, read the applicable root-to-nearest `AGENTS.md` chains and relevant indexed co-located `DECISIONS.md` entries when project contract context is needed.

3. **Find the primary sources** for each conflict. Understand deeply why each change was made, and what the original intent was. Read the commit messages, check the PRs, check original issues/tickets.

4. **Resolve each hunk.** Preserve both intents where possible. Where incompatible, pick the one matching the merge's stated goal and note the trade-off. Do **not** invent new behaviour. Always resolve; never `--abort`.

5. Discover the project's **automated checks** and run them — typically typecheck, then tests, then format. Fix anything the merge broke.

6. **Finish the merge/rebase.** Stage everything and commit. If rebasing, continue the rebase process until all commits are rebased.
