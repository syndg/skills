---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Resolve repository contract context only when the research itself examines repository code, plans, or conventions. Before that repository research, if `dox.config.json` exists, invoke `/dox` with one research task and every known relevant path. Treat DOX as a direct cutover: do not enumerate its records or also read `AGENTS.md`. Without DOX, read the applicable root-to-nearest `AGENTS.md` chain and any relevant co-located `DECISIONS.md` entries it indexes when project contract context is needed. External-only research does not run either resolver.

Then spin up a **background agent** to do the research, so you keep working while it reads. A subagent in the same worktree may receive compact DOX items or relevant fallback context already resolved for the same task and paths. A subagent in another worktree resolves locally and treats any supplied compact items only as hints.

Its job:

1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.
