---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Before repository exploration or code work, establish contract context for this exact implementation. If `dox.config.json` exists, invoke `/dox` with one implementation task and every known relevant path, then carry its compact resolved items into the work and any delegated TDD step only when it remains in the same worktree with the same task and path set. Treat that as a direct cutover: do not enumerate DOX records or also read `AGENTS.md`. Without DOX, read the applicable root-to-nearest `AGENTS.md` chain and any co-located `DECISIONS.md` entries it indexes when project contract context is needed. Another worktree resolves locally and treats supplied compact items only as hints. `/mp-code-review` resolves its own review context later using changed-path and base semantics.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /mp-code-review to review the work.

Commit your work to the current branch.
