---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

When `dox.config.json` exists, follow the installed `/dox` skill for retrieval eligibility, context reuse across implementation and delegated TDD, and maintenance. The closing `/mp-code-review` follows the same policy for the actual work under review. Without DOX, read the applicable root-to-nearest `AGENTS.md` chain and indexed co-located `DECISIONS.md` entries when project contract context is needed.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /mp-code-review to review the work.

Commit your work to the current branch.
