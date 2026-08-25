---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section that names each skill the next agent should explicitly invoke using `/skill`-style prose.

Keep settled material at its source. In an unconfigured project, reference specs, plans, issues, commits, diffs, and the applicable root-to-nearest `AGENTS.md` chain or its indexed co-located `DECISIONS.md` entries by path, decision number, or URL instead of copying them.

When `dox.config.json` exists, include the target task and known paths, then instruct the target to rerun `dox resolve` from its destination worktree. A receipt is a local manifest, not loaded contract prose, so do not pass one as the contract or direct the target to read DOX record paths. If the destination cannot access the source repository and portability requires project language, include only the relevant compact items from the current resolution envelope and label them explicitly as hints, not authority.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
