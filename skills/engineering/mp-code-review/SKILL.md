---
name: mp-code-review
description: Review changes since a fixed point for Standards and Spec compliance, including a required simplicity and test-value check. Identify unnecessary architecture, weak tests, and unsupported implementation assumptions without cutting required behavior. Run the two reviews independently and report them separately. Use for branch, PR, or work-in-progress reviews, "review since X", and requests to check a change for overengineering.
---

Two-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards**: does the code follow repository conventions, with justified architecture and useful tests?
- **Spec**: does the code implement the requested behavior, and which plan assumptions remain unconfirmed?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.

This is a review, not authorization to edit, delete tests, commit, or push. Report justified simplifications; apply them only when the user requests changes.

The issue-tracker workflow should have been provided through project context. If it is unavailable when resolving an issue reference, tell the user to run `/setup-matt-pocock-skills`.

## Process

### 1. Select the fixed point

Whatever the user named is the fixed point: a commit SHA, branch name, tag, `main`, `HEAD~5`, and so on. If they did not specify one, ask.

### 2. Identify the review scope and contract context

Confirm the fixed point with `git rev-parse <fixed-point>` and capture changed paths with `git diff --name-only <fixed-point>...HEAD`. Respect any path limits the user supplied. A bad ref or an empty changed-path set fails before either review begins.

Select one contract route:

- **Configured DOX:** follow the installed `/dox` skill for retrieval eligibility, context reuse, maintenance, and delegated review context. Use the actual review paths; include the whole branch only when that is the requested review scope.
- **Unconfigured fallback:** read each changed file's applicable root-to-nearest `AGENTS.md` chain and any indexed co-located `DECISIONS.md` entries before inspecting the full diff or commit log.

After the selected contract route is satisfied, capture each remaining input once, limiting the diff to the requested paths when applicable:

- Diff: `git diff <fixed-point>...HEAD`
- Commits: `git log <fixed-point>..HEAD --oneline`

An empty diff also fails before either review begins.

Follow the owning code, callers, and linked changes when needed to judge the reviewed behavior. A PR boundary is not proof that two definitions are independent. Respect explicit scope limits and report out-of-scope dependencies rather than starting a repository-wide cleanup.

### 3. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.) — fetch via the configured issue-tracker workflow.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If there is none, skip the **Spec** review and report "no spec available".

Record the source of each requirement and any explicit behavior the user says to preserve. Distinguish user requirements and settled contracts from a plan's implementation prescriptions. A generated plan can contain unnecessary architecture; generation alone is not evidence that a choice is wrong. Review unconfirmed assumptions as proposals, not requirements. If a simplification would change a settled contract, label it as requiring a contract decision rather than silently overriding it.

### 4. Identify the standards sources

Use standards documents discovered through the resolved project context or targeted repository inspection, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`. In a non-DOX project, include applicable standards from the root-to-nearest `AGENTS.md` chains.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.

Each smell suggests an investigation, not an automatic refactor. Apply the simplicity check below before recommending a new type, wrapper, module, or polymorphic design; the proposed cure must reduce current complexity.

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

#### Required simplicity and test-value check

Run this check inside Standards even when no repository standard or spec exists. Use the installed `/ponytail` skill for the smallest-complete-solution principles; this check applies them to existing changes. Fewer lines, files, or tests are not the objective. Preserve the complete requested behavior.

Trace each material addition to a current requirement, real consumer, trust boundary, failure mode, or repository convention. Investigate:

- Duplicate schemas, handlers, validation, mounted state, and sources of truth. Reuse the existing owner where semantics match; retain intentional boundary or draft-versus-published differences.
- Forwarding wrappers, single-case frameworks, extension points, dependencies, and configuration without a present need. Prefer existing code or native capabilities over introducing another abstraction.
- Persistence, retries, caches, queues, and recovery machinery whose cost exceeds the actual lifecycle requirement. Trace cancellation, crashes, re-entry, and side effects before proposing removal. Read-only work may need less machinery than writes, but that distinction alone is not proof.
- Defensive checks and heuristic classifiers that reject valid work, duplicate a trusted boundary, or claim guarantees they cannot provide. Identify the threat and the remaining protection; simplify the mechanism rather than weaken the requirement.
- Tests that pin prompt wording, source or SQL substrings, internal wiring, mock echoes, or a scripted model's "decisions" instead of observable behavior. For each questioned test, name the plausible bug it catches. Exact assertions are valid for actual protocol or content contracts; mocks are not inherently low-value. Preserve meaningful boundary, authorization, concurrency, failure, and recovery coverage. Propose deletion, consolidation, or a behavioral replacement based on the protection lost.
- Plans, comments, and review descriptions that prescribe removed machinery or claim unobserved verification. Identify which source needs correction so the burden is not recreated.

Keep explicitly required capabilities, including multiple real providers. Preserve authorization, validation, accessibility, durability, idempotency, and concurrency guarantees. Passing tests do not justify unnecessary architecture, and suspected overengineering does not justify removing a safeguard whose purpose is still unknown.

For every simplicity finding, cite the file/hunk and give the current cost, the missing justification, the smallest concrete alternative, the behavior or guarantee it preserves, and a targeted way to verify it. Group related evidence and verification in compact findings. Distinguish evidence-backed defects from design suggestions and unresolved questions. Report no justified simplification when the evidence supports keeping the design; do not manufacture a deletion quota.

### 5. Run both reviews independently

Delegate both reviews in parallel when independent execution is available. Otherwise, run them in sequence with separate contexts.

**Standards review input** — include:

- The full diff command, commit list, and changed paths.
- Applicable standing meaning and complete binding obligations for standards review, under the installed `/dox` skill's delegation policy when configured.
- The list of standards-source files, **plus the smell baseline and required simplicity check from step 4** in full. Supply the `/ponytail` principles and the requirement-provenance and preservation notes from step 3; do not assume child agents inherit them.
- The brief: "Perform the Standards review, including the required simplicity and test-value check. Cite documented breaches by file and rule. Label smells and simplification suggestions as judgement calls unless there is an evidenced defect or binding violation; a documented repository standard overrides a baseline smell. Give simplicity findings the evidence, alternative, preserved behavior, and verification described in step 4. Keep this axis independent from spec compliance. Skip tooling-enforced style findings. Be concise without dropping material findings or their evidence."

**Spec review input** — include:

- The diff command, commit list, and changed paths.
- The path or fetched contents of the spec, with requirement provenance and explicit preservation notes from step 3.
- Applicable standing meaning and complete binding obligations for the changed paths, under the installed `/dox` skill's delegation policy when configured. Use them to understand project terms and constraints, not to invent requirements absent from the spec.
- The brief: "Report missing or partial requirements, unrequested behavior, and incorrectly implemented requirements. Quote the authoritative source for each finding. Separately flag unconfirmed plan assumptions; do not treat generated implementation prescriptions as user requirements or discard settled contracts as slop. Keep this axis independent from standards compliance. Be concise without dropping material findings or their evidence."

If the spec is missing, skip the Spec review and note this in the final report.

### 6. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings — the two axes are deliberately separate (see _Why two axes_).

Within `## Standards`, include `### Simplicity and test value` with the corresponding findings, or explicitly state that no justified simplification was found. Keep unconfirmed plan assumptions within `## Spec`, separate from compliance failures. Name any required complexity retained when it was a plausible removal candidate. Leave the review read-only unless edits were requested.

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
