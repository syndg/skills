---
name: claude-handoff
description: Hand the current conversation off to a fresh background agent that picks up the work immediately.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff summary of the current conversation so a fresh agent can continue the work. Instead of saving it, launch a background agent seeded with the summary as its prompt: `claude --bg --name "<descriptive name>" "<handoff summary>"`. It starts in the current working directory and returns immediately; the user manages it with `claude agents`.

Always pass `-n`/`--name` with a descriptive name (e.g. `--name "Fix login bug"`) — it sets the display name shown in the job list, session picker, and terminal title.

Include a "suggested skills" section in the summary, naming each skill the next agent should explicitly invoke using `/skill`-style prose.

Keep settled material at its source. In an unconfigured project, reference specs, plans, issues, commits, diffs, and the applicable root-to-nearest `AGENTS.md` chain or its indexed co-located `DECISIONS.md` entries by path, decision number, or URL instead of copying them.

For configured DOX, include the target task and known paths and direct the background agent to the installed `/dox` skill's handoff and local-grounding policy. Do not pass a receipt or a direct record path as loaded contract content.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information — the summary becomes the agent's prompt.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the summary accordingly.
