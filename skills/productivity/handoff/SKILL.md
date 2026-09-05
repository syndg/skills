---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section that names each skill the next agent should explicitly invoke using `/skill`-style prose.

Keep settled material at its source. In an unconfigured project, reference specs, plans, issues, commits, diffs, and the applicable root-to-nearest `AGENTS.md` chain or its indexed co-located `DECISIONS.md` entries by path, decision number, or URL instead of copying them.

For configured DOX, include the target task and known paths and direct the recipient to the installed `/dox` skill's handoff and local-grounding policy. Do not pass a receipt or a direct record path as loaded contract content.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
