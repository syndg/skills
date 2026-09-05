---
name: ponytail
description: >
  Use on every coding task that designs, implements, fixes, or refactors a
  feature. Find the smallest complete solution: reuse existing code, prefer
  standard-library and native platform features, avoid speculative layers and
  dependencies, and keep the change proportional to the requested behavior.
  Also use when a proposed change adds boilerplate, indirection, configuration,
  or many files. Do not use for non-code writing or external research.
license: MIT
metadata:
  source: https://github.com/DietrichGebert/ponytail
  source-version: v4.9.0
  adapted-for: syndg/skills
---

# Ponytail

Build the smallest complete solution. Small means fewer concepts, layers, files,
and dependencies. Complete means every requested behavior and acceptance
criterion works end to end.

The task defines **what** must work. It does not require the largest possible
architecture for **how** it works.

## Preserve the product

Read the settled requirements and the code that owns the behavior. Anchor scope
to the authoritative original requirements, designs, accepted decisions, and
explicit acceptance criteria, together with the user's stated precedence and
supersession. Agent summaries are navigation aids, not substitutes for the
originals. A later clarification updates scope; do not claim an older design
specified it.

Simplify the implementation, not an approved journey, decision, feedback or
consent step, or visual design. Treat "MVP" and "v0" as deferring only work the
user explicitly agreed to defer. If a smaller implementation would change the
experience, state the concrete tradeoff and get the user's decision before
editing.

## Before designing

Inspect the actual repository and the module that owns the behavior. When a
design-only prompt provides no code, state the one assumption needed for the
recommendation and give one path. Do not enumerate optional architectures.

For a frontend flow, first trace the design-backed contract:
entry points, branches, screens or dialogs, transitions, loading, error and
empty states, confirmations, success states and next actions, and return paths. Use the
supplied states as the scope. Flag consequential states the sources leave
unspecified and resolve them from the requirements or with the user; do not
invent a larger product to fill the gap.

Reuse existing components while preserving the required appearance and
behavior. Matching fields or backend capability is not visual equivalence.
"One direct path" means one direct code path from input to observable result; it
does not mean collapsing required product branches.

## Choose the smallest complete design

Stop at the first option that fully satisfies the settled scope:

1. No code. The behavior already exists or configuration, documentation, or a
   native capability is enough.
2. Existing code. Extend the current helper, component, module, or seam.
3. Standard library or native platform feature.
4. Already-installed dependency.
5. Direct code at the owning seam.
6. A new abstraction, only when the current behavior needs one.

Search before creating. A second convention beside an existing one is more
complex than reusing the first.

Keep domain behavior near the data and module that own it. Hide necessary
complexity behind an existing deep interface rather than spreading plumbing
through callers. Add a layer only when it removes more current complexity than
it introduces. Evidence includes multiple real implementations, an existing
architectural boundary, a required trust boundary, or repeated behavior already
present in the repository. A hypothetical future use is not evidence.

Default away from speculative machinery:

- extension points, registries, factories, and strategy objects with one case
- wrappers that only rename or forward a call
- configuration for a value the current product does not vary
- custom infrastructure when the platform already owns the problem
- caches, retries, queues, telemetry, and background work without a present
  requirement or measured need
- compatibility layers during a clean cutover

These prompts find a smaller design; they do not remove required security,
validation, accessibility, error handling, durability, concurrency control, or
physical-world calibration.

## Complexity gate

Run this gate before the first edit and again before delivery. Every added file,
layer, dependency, configuration option, helper, and test abstraction must
serve a current requirement or an existing repository convention.

Reject the design and make it smaller when any answer is yes:

- Can a standard-library, native, or already-installed feature replace it while
  preserving the required behavior and appearance?
- Does an existing module already own the behavior?
- Is this abstraction serving only one implementation without a real boundary?
- Is a wrapper forwarding calls without hiding meaningful complexity?
- Is configuration being added for a value the product does not vary?
- Are tests proving plumbing rather than observable behavior?
- Is any file present only to support architecture the request did not need?

Passing tests do not waive this gate. Remove unjustified machinery, rerun the
affected verification, and only then deliver.

## Keep scope and plans explicit

Never shrink explicit scope to make the diff smaller. Implement every requested
behavior, but reject implementation work that does not serve it. Use the fewest
files consistent with a coherent cutover. Update every real caller, test,
document, index, and configuration entry affected by the chosen change. Remove
obsolete paths instead of leaving aliases or duplicate flows.

Connect each relevant authoritative frame, state, and transition in the changed
flow to implementation and verification evidence. Use an existing plan or
checklist, or a brief inline list when none exists. Mark each item
**implemented**, **explicitly deferred** only when agreed, or **unresolved**.
Unresolved is not done. Record only the changed flow; do not create a new
tracking artifact for a tiny edit.

## Verify proportionally

Use the project's existing test framework and verification commands. Add or
change the smallest test set that proves changed observable contracts and a
plausible regression. Reuse existing coverage and test files. Do not multiply
tests for plumbing, implementation branches, or equivalent input permutations.
Functional tests prove behavior; they are not visual acceptance.

For frontend work, exercise the changed flow in a browser and compare
screenshots with the authoritative design in proportion to the change. Use
`/figma-design-to-code` when the source is a Figma design, `/playwright-cli` for
the browser procedure, and `/mp-code-review` when a review applies. Review the
original requirements and designs plus explicit deferrals, not only an agent
summary. If the runtime or design is unavailable, report the missing evidence
and do not claim acceptance. A small cosmetic fix needs a screenshot of the
affected element and state, not a whole-journey audit.

Run the actual changed path. A small diff without behavioral proof is not
complete.

## Report

State what changed, the verification evidence, and any unresolved or explicitly
deferred scope. If a tempting abstraction or dependency was unnecessary, name
what replaced it in one short line. Keep the answer concise without dropping
failures, risks, or proof.