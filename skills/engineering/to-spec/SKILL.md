---
name: to-spec
description: "Synthesize settled discussion into one issue with the approved spec and a code-grounded implementation plan for a fresh session."
disable-model-invocation: true
---

Create or update one spec issue from the current conversation, whether the change is small or large. Synthesize settled discussion without restarting grilling. Stop at the issue and handoff; implementation belongs in a fresh session. Decomposition through `/to-tickets` is a separate, explicit user choice, never a consequence of size.

The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

## Process

### 1. Recover settled context

When `dox.config.json` exists, follow the installed `/dox` skill for retrieval eligibility, context reuse, and maintenance. Without DOX, read the applicable root-to-nearest `AGENTS.md` chain and relevant indexed co-located `DECISIONS.md` entries when contract context is needed; use its Ubiquitous Language and respect its inherited Architectural Decisions.

Read the current discussion for requirements, settled grilling decisions, rejected alternatives, rationale, and explicit approvals. Read the full body and comments of supplied issue references. For a wayfinder map, also read the linked decisions needed to synthesize the spec. Resolve truncated reads before treating the source as complete.

Choose the publication target separately from the source context:

- Update an existing spec issue identified by the user or source references rather than creating a duplicate.
- Treat wayfinder maps and decision issues as source context. Preserve them and their history; when no existing spec is identified, create one spec issue linking back to those sources.
- Convert a source issue into the spec only when the user explicitly requests that conversion.

Distinguish user-approved requirements and binding design decisions from proposed implementation details. Record where each consequential decision came from: the discussion, an issue or comment, a prototype, or a governing project record. Cite available references; identify conversation decisions without inventing links or approval.

### 2. Ground the implementation plan

Inspect the relevant code, callers, interfaces, and existing verification paths. Reuse current patterns. Record the repository revision used for this inspection and any relevant uncommitted changes so a fresh session can check freshness.

Build an ordered implementation plan. For each step, identify the intended change, verified existing paths and symbols, dependencies on earlier steps, and the observable verification. Include affected callers and required contract migrations, not just the central module. Mark proposed new paths or symbols as new rather than claiming they exist.

Prefer existing test seams at the highest useful level, with as few seams as the behavior needs. Carry forward seams already settled in the discussion. Ask only about a remaining seam choice or consequential approval that the discussion has not resolved; do not repeat settled questions or start a new interview. Keep unresolved choices visible rather than guessing.

### 3. Publish one current spec

Write the issue body using the template below. Cover the full feature without padding the user stories or forcing feature language onto a refactor. Paths and symbols are revision-grounded planning evidence, not timeless requirements; tell the implementation session to recheck them before editing.

- For a remote tracker such as GitHub or GitLab, publish or update one issue. Do not create a local plan mirror or sub-issues.
- For a configured local tracker, create or update one spec issue using its existing file convention.

The body is the canonical current feature contract. Comments record progress, deviations, approval history, and reviews. Fold approved requirement changes back into the body and record their rationale in the history; proposals in comments do not silently change scope. Durable project meaning stays in the selected project-contract store.

Apply the configured label for `ready-for-agent` only when the user has explicitly approved the current requirements and consequential decisions, the implementation plan and verification approach are complete, and no consequential open questions remain. Approval already present in the discussion counts; publishing a draft or invoking `/to-spec` does not. Otherwise use the configured non-ready triage role that matches the remaining work, remove any conflicting ready label, and state what blocks readiness. Do not invent label strings.

### 4. Hand off and stop

Return the issue URL, or the configured local issue reference, and its readiness state. For a ready spec, give a fresh-session handoff such as `/implement <issue-reference>`. The new session must read the current body and relevant comments, recheck repository grounding, and own implementation, verification, and repairs. Carry forward any user-designated review model in the issue's review requirements; actual model selection depends on the implementation environment, not this skill's prose.

For a draft, list the unresolved approvals or questions before the future handoff. Do not start implementation or automatically invoke decomposition.

<spec-template>

## Problem and intended outcome

The problem and the result the user needs.

## Approved requirements

Observable behavior, constraints, and relevant user stories. Separate approved requirements from anything still proposed. Use enough detail to implement the whole feature, without relying on the planning conversation.

## Acceptance criteria

Checkable outcomes covering the approved scope, including relevant boundaries and failure behavior.

## Settled decisions and rationale

Each consequential decision, why it was chosen, important rejected alternatives, its source, and approval status. Distinguish binding decisions from implementation suggestions. Include decision-rich prototype snippets only when they are more precise than prose, with their provenance.

## Repository grounding

Repository and inspected revision, relevant uncommitted changes, and verified paths, symbols, interfaces, and prior art. Identify proposed new locations separately. Recheck this grounding against the implementation checkout before editing.

## Ordered implementation plan

Numbered steps with concrete changes, affected paths and symbols, dependencies, caller or contract migrations, and per-step verification. Label proposed implementation details separately from binding requirements.

## Verification

Agreed test seams, relevant existing tests or smoke checks, and how to exercise the acceptance criteria. Test external behavior rather than implementation details. Include the applicable repository gates and any user-stated review requirements. These are planned checks, not claims that implementation has passed them.

## Out of scope

Explicit exclusions and rejected scope.

## Open questions and readiness

Unresolved questions, proposed choices awaiting approval, and their effect on readiness, or "None" when settled. Record the approval source for the current requirements and consequential decisions; otherwise mark the issue as a draft.

</spec-template>
