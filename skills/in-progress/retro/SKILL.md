---
name: retro
description: "Conduct a retrospective on a coding session."
disable-model-invocation: true
---

The user has asked for a **retrospective**. You are suggesting improvements to the coding agent's **environment** to improve future runs.

## Steps

1. Run the `/writing-for-agents` skill for the writing and pruning vocabulary.

2. Read the primary sources for the session the user specifies. This may require searching local session logs. If the user does not specify a session, use the current one. When `dox.config.json` exists, follow the installed `/dox` skill for retrieval eligibility, context reuse, and maintenance. Otherwise read the applicable root-to-nearest `AGENTS.md` chain and any decision file that chain indexes.

3. Look for candidates for improvement in these categories.

- **Navigation**: how easy was it for the agent to find the right files? Are there hidden dependencies between files? Would a **navigation pointer** make it easier? _Use when_ the session took a long time to find a piece of information.
- **Automated checks**: are there automated checks that could catch errors the agent made? Linting, typing, tests, filesystem linters? _Use when_ the agent made a mistake that could have been caught by an automated check.
- **Coding standards**: should the **reviewer agent** be given a new rule to enforce? Should an existing rule be removed or clarified? _Use when_ the reviewer agent failed to catch a mistake.
- **Steering load**: choose the repository's contract branch first. In a configured DOX project, ask whether durable contract prose belongs in a record and whether its ownership, path evidence, or invariant bindings are incomplete. In an unconfigured project, ask whether always-loaded `AGENTS.md` instructions should move to indexed `DECISIONS.md`, coding standards, or pointed-to references, and whether a **Child DOX Index** entry is missing. Never apply the `AGENTS.md` index convention to configured DOX. _Use when_ steering files are large, ambiguous, or repeatedly load unrelated material.
- **Tool economy**: did the agent make expensive tool calls that could be streamlined? Is there any custom tooling (CLI's, MCP's) that is particularly token-inefficient? _Use when_ the agent made an expensive tool call.
- **No-ops**: look for instructions in steering files that don't modify the agent's behavior. _Use when_ the steering files are large and unwieldy.
- **Information access**: look for opportunities to increase the agent's access to information. Teeing dev server logs, readonly access to third-party services. _Use when_ a crucial piece of information was not available to the agent.

4. Present these candidates to the user, in order of severity.

## Reference

### Implementation vs Review

Implementation and review place different pressure on context. The implementation agent must explore, write code, and debug failures. The review agent starts from a diff and fixed point, but still needs the applicable contracts, standards, spec, and enough targeted exploration to verify a finding.

Prefer automated checks for deterministic rules and review instructions for judgement calls. Keep implementation steering focused on information needed while changing code.

### Files

Choose one project-contract branch before inspecting contract sources:

- **Configured DOX:** follow the installed `/dox` skill's retrieval and reuse policy, then judge the delivered meaning and obligations. DOX remains the canonical contract store, not a parallel source beside `AGENTS.md`, `DECISIONS.md`, or **Child DOX Index**.
- **Unconfigured project:** use the applicable `AGENTS.md` hierarchy for always-loaded bindings and navigation pointers. Read a co-located `DECISIONS.md` only when the owning `AGENTS.md` indexes it, and use **Child DOX Index** only to navigate child `AGENTS.md` files. This branch is an `AGENTS.md`/`DECISIONS.md` contract, not DOX.

In either branch, also inspect:

- Coding standards and automated-check configuration: review rules and machine-enforced constraints.
- Reference docs: material reached through explicit context pointers.
- Skills: reusable workflows or disciplines, written according to `/writing-for-agents`.
