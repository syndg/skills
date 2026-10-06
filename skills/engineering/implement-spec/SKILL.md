---
name: implement-spec
description: "Implement the result of /to-spec and /to-tickets in code."
disable-model-invocation: true
---

You have been provided a spec with associated tickets describing how to implement it.

The issue tracker should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

The goal is the entire spec implemented on a single **integration branch**, with every ticket resolved the way the issue tracker closes work.

The tickets are a **task graph**, not a list of steps. Blocking relationships define a changing **frontier** of tickets ready to be claimed.

Communication to and from subagents should be sparse. Point to the spec, issues, research notes, and previous commits instead of duplicating them. For configured DOX, follow the installed `/dox` skill's handoff policy.

Run implementer subagents in the background where possible, but cap concurrency to what the repository and available worktrees can safely support.

## Steps

1. **Load contracts and graph.** When `dox.config.json` exists, follow the installed `/dox` skill for retrieval eligibility, context reuse, and maintenance. Otherwise read the applicable root-to-nearest `AGENTS.md` chains and their indexed co-located `DECISIONS.md` entries. Read the spec and tickets, validate every blocking edge, and stop on cycles, missing tickets, or an empty frontier with unfinished work.

2. **Preflight the repository.** Require a clean tracked worktree and no active merge or rebase. Inspect existing worktrees, branch/stack state, and repository-specific T3 or worktree instructions. Preserve all user work; do not stash, reset, clean, or reuse a worktree owned by another task.

3. **Explore once when useful.** Use an exploration subagent for codebase or external-documentation research shared by multiple tickets. Save durable notes at an agreed project path, or transient notes in the OS temporary directory, and pass them by context pointer.

4. **Create the integration branch.** Do this only after the graph and repository preflight pass. If the issue tracker closes work through PRs, or the user asks for one, open a draft PR after the first merge in step 6 (a branch with no commits ahead of main can't open one), marked as closing the spec and its tickets.

5. **Work the frontier.** Give each ticket to an implementer subagent in its own branch and worktree.
   - In configured DOX, every implementer follows the installed `/dox` skill's local grounding and reuse policy in its assigned worktree.
   - In an unconfigured project, every implementer reads the applicable root-to-nearest `AGENTS.md` chain and any relevant co-located `DECISIONS.md` entries it indexes from its assigned worktree.
   - Each implementer confirms its worktree is based on the integration branch before starting (and resets onto it if not), calls the Skill tool with `tdd` to build the ticket, and merges the integration branch tip into its own branch before reporting done.

   Include the ticket, verification requirements, and integration-branch base. An implementer owns only its worktree.

6. **Integrate deliberately.** After an implementer finishes and reports its verification evidence, use a merger subagent to bring that branch into the integration branch. Recompute the frontier after every integration and dispatch newly unblocked tickets.

7. **Review the completed graph.** Once every ticket is integrated, run `/mp-code-review` against the integration branch's fixed point. Fix accepted findings in one scoped implementer subagent, then rerun the affected verification.

8. **Finish.** If a draft PR exists, mark it ready for review only after the task graph, review, and project verification are complete. Otherwise resolve each ticket the way the issue tracker closes work, and report the integration branch.

9. **Clean up.** Remove only worktrees created by this run, after confirming their branches are integrated and clean.
