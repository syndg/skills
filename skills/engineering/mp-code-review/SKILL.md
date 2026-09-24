---
name: mp-code-review
description: Review changes since a fixed point for Standards and Spec compliance, including a required simplicity and test-value check. Identify unnecessary architecture, weak tests, and unsupported implementation assumptions without cutting required behavior. Run the two reviews independently and report them separately. Use for branch, PR, or work-in-progress reviews, "review since X", and requests to check a change for overengineering.
---

Review a stable code snapshot along two independent axes:

- **Standards**: does the code follow repository conventions, with justified architecture and useful tests?
- **Spec**: does the code implement the requested behavior, and which plan assumptions remain unconfirmed?

The session running this skill directly dispatches one reviewer per axis into separate fresh contexts. It may be the implementation session; it does not delegate to another review coordinator. Reviewers receive the same captured inputs, not the author's conversation or each other's reasoning.

This is a read-only review, not authorization to edit, delete tests, stage, commit, or push. The implementation session owns verification and repairs. Evidence-backed in-scope defects can inform repairs; scope, contract, and design disputes need a user decision.

The issue-tracker workflow should have been provided through project context. If it is unavailable when resolving an issue reference, tell the user to run `/setup-matt-pocock-skills`. Keep remote issues canonical; a review snapshot is evidence for this run, not a local plan mirror.

## Process

### 1. Resolve scope and execution capabilities

Resolve these inputs from the user or invoking workflow before dispatch:

- **Mode:** committed or working-tree. Use committed mode for a committed branch/PR review, and working-tree mode when reviewing work before its final commit. Ask if the intended mode is unclear.
- **Fixed point and scope:** accept the supplied review baseline, commit SHA, branch, tag, or relative ref, plus owned paths/hunks and exclusions. If no baseline was supplied, ask. Do not silently include all branch work when the caller supplied a narrower implementation scope.
- **Review model:** use the user's designation, otherwise an applicable project designation. When neither exists, independent reviewers may use the environment's normal default. A designation applies to both axes.

Inspect the environment's available execution capabilities and documented model selection. Resolve a designation to an available model through those capabilities, not a guessed identifier or a sentence in the review prompt. For a designated model, confirm effective routing for each reviewer from authoritative configuration or execution metadata. A worker's claim about its identity is not evidence. Record the designation, resolved routing, and evidence; do not claim billing guarantees.

Dispatch directly into two independent contexts, in parallel where possible. Sequential execution is acceptable only with separate fresh contexts. Reviewers perform their assigned axis themselves; they must not invoke this skill again, delegate, or create a coordinator. If independent execution is absent, or a designated model is unavailable or its routing cannot be verified, prepare the portable briefs in step 5 and mark the affected axes blocked. Do not substitute self-review or another model. Standalone use without a model designation does not require selecting a particular model.

### 2. Capture the code snapshot and contract context

Resolve the supplied fixed point to commit `R` and capture `HEAD` as commit `H`. Resolve review base `B` as the merge-base of `R` and `H`, recording all three hashes. This preserves three-dot branch review semantics without treating changes on the base branch as changes in the implementation. An exact implementation baseline that is an ancestor of `H` resolves to itself. An invalid ref, missing or ambiguous merge-base, or an incompatible requested baseline blocks capture until resolved.

Use explicit hashes, not moving refs, in the captured commands:

| Mode | Code included |
| --- | --- |
| Committed | The scoped diff `git diff B H` and commit list `git log B..H --oneline`. Staged, unstaged, and untracked work is excluded and reported as such. Read file context at `H`, not from a dirty checkout. |
| Working-tree | The scoped net tracked diff `git diff B`, with staged and unstaged changes inventoried separately using `git diff --cached H` and `git diff`. Include the scoped commit list `git log B..H --oneline` and every in-scope untracked file's actual contents. For only uncommitted work, use `HEAD` as the supplied fixed point so `B = H`. |

Apply path limits to diffs and commit lists, and record hunk-level limits separately. Enumerate untracked paths, for example with `git ls-files --others --exclude-standard`, then read their contents. Track additions, deletions, renames, file modes, and binary changes; record any unreadable content as a coverage blocker. Never stage files or make interim commits to expose them to review. A working-tree snapshot containing only untracked additions is non-empty. Fail as empty only after checking all in-scope committed, staged, unstaged, and untracked content applicable to the mode.

For working-tree review, use the caller's starting-state inventory and ownership record to exclude pre-existing user edits, including individual hunks within shared files, unless the user explicitly included them in the review. Preserve those edits untouched. Capture their exclusions and the final file context so reviewers can distinguish owned changes from surrounding user content. Without a starting-state record, use explicit user scope; status alone cannot establish authorship. If ownership cannot be separated from an overlapping hunk, ask for a scope decision and mark that portion blocked rather than reviewing or reverting it as implementation work.

Select one contract route using the actual review paths:

- **Configured DOX:** follow the installed `/dox` skill for retrieval eligibility, context reuse, maintenance, and delegated review context. Include the whole branch only when that is the requested review scope.
- **Unconfigured fallback:** read each changed file's applicable root-to-nearest `AGENTS.md` chain and any indexed co-located `DECISIONS.md` entries before inspecting the full diff or commit log.

After resolving contract context, capture the complete scoped patch and file context once. Both reviewers must see the same final contents, including new files and excluded surrounding hunks labelled as context only. Preserve staged/unstaged distinctions in the inventory without double-counting their net change. Include full files or accessible immutable copies when a patch lacks the context needed for review.

Freeze edits during capture and review. Give the snapshot an identifier derived from its commit hashes and captured content digests. Record paths, owned hunks, exclusions, commands, commit list, patch, additional file contents, and verification evidence supplied by the caller. Make this material reusable through ordinary text, attachments, or accessible immutable files; a live diff command or private session link alone is insufficient.

Follow owning code, callers, and linked changes when needed to judge the reviewed behavior. A PR boundary is not proof that two definitions are independent. Respect explicit scope limits and report out-of-scope dependencies rather than starting a repository-wide cleanup. Capture any additional context against the same code snapshot.

### 3. Capture the spec snapshot

Resolve the authoritative spec in this order:

1. An explicit issue URL/number, spec path, or supplied spec snapshot from the user or invoking workflow. This takes priority over commit-message inference.
2. Issue references in the captured commit messages, resolved through the configured issue-tracker workflow. Distinguish issue references from merge-request references, and follow the latter to their originating issue when needed.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. Ask the user where the spec is. If the user confirms there is none, skip Spec and report "no spec available".

For an issue, retrieve the full body and relevant comments, including approvals, progress, deviations, and previous reviews; do not use a title or truncated preview as the spec. Read the full comment history as needed to identify those comments. If a supplied snapshot is the intended historical reference, preserve that version rather than silently replacing it with a later issue body. If an explicitly required source cannot be retrieved, mark Spec blocked, not skipped, and do not replace it with an inferred source.

Capture source identifiers and revision, update time, or content digest. Give both axes the same requirements snapshot and provenance. The issue body holds current approved requirements, settled decisions and rationale, ordered plan, and acceptance/verification criteria. Comments record history and proposed changes; approved requirement changes belong back in the body. Flag an approved comment/body mismatch for reconciliation rather than silently changing scope. Reviewers remain read-only.

Distinguish approved requirements and settled contracts from proposed implementation details, even when both appear in the issue body. Record explicit preservation constraints and unresolved decisions. A generated plan can contain unnecessary architecture; generation alone is not evidence that a choice is wrong. Review unconfirmed assumptions as proposals, not requirements. A simplification that changes a settled contract requires a contract decision.

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

### 5. Dispatch the two axis reviews

Create a self-contained brief per axis. Each includes:

- The same snapshot identifier, resolved base/HEAD hashes, mode, scope and exclusions, commit list, full scoped patch, and extra file contents from step 2. Include the captured file context or transferable immutable access to it.
- The same requirements snapshot, source identifiers, approval provenance, preservation constraints, and unresolved decisions from step 3.
- Applicable standing meaning and complete binding obligations under the selected contract route, following the installed `/dox` skill's delegation policy when configured.
- The designated review model and routing evidence, or an explicit statement that the environment default is in use without a designation.
- Supplied verification evidence and its limits. Reviewers inspect and report; they do not edit files, run repair loops, stage, commit, or push.
- The output contract from step 6 and the instruction to perform only the assigned axis, without delegating, invoking this skill again, or reading the other axis's report.

For **Standards**, also include the standards sources, the smell baseline and required simplicity/test-value check from step 4 in full, and the installed `/ponytail` principles. Do not assume a reviewer inherits this skill or can resolve its local paths.

Standards brief: "Perform the Standards review, including the required simplicity and test-value check. Cite documented breaches by file and rule. Label smells and simplification suggestions as judgement calls unless there is an evidenced defect or binding violation; a documented repository standard overrides a baseline smell. Give simplicity findings the evidence, alternative, preserved behavior, and verification required by the supplied check. Keep this axis independent from spec compliance. Skip tooling-enforced style findings. Be concise without dropping material findings or their evidence."

Spec brief: "Report missing or partial requirements, unrequested behavior, and incorrectly implemented requirements. Quote the authoritative source for each finding. Use project contracts to understand terms and binding constraints, not to invent requirements absent from the spec. Separately flag unconfirmed plan assumptions; do not treat generated implementation prescriptions as user requirements or discard settled contracts as slop. Keep this axis independent from standards compliance. Be concise without dropping material findings or their evidence."

The parent sends each brief directly to its axis reviewer using the routing resolved in step 1. If a capability or input blocks execution, return the complete briefs as portable handoffs for separate user-run sessions on the designated model, or the default when none was designated. Include any missing-source instructions and mark unresolved inputs explicitly. Reuse the same snapshot for both sessions; require independent reports and, when a model was designated, environment routing evidence before accepting their results. A prepared brief is pending work, not a completed review.

If the user confirmed no spec exists, Standards still runs its baseline and simplicity check; mark Spec skipped. Otherwise, a failed, incomplete, wrong-model, or unverifiably routed designated-model review is blocked even if it produced findings. Keep any usable evidence, but do not count it as completion.

### 6. Report without blending the axes

Present separate `## Standards` and `## Spec` reports, verbatim or lightly cleaned. Do not merge or rerank findings. For each axis state:

- **Completed**, **blocked/pending**, or **skipped**, with the reason for any non-completion.
- Snapshot identifier and actual reviewed scope, including coverage gaps.
- Designated model and verified routing evidence, or the undesignated default and any available execution metadata.
- Findings with citations, separating evidenced defects, design suggestions, and unresolved questions.

Within Standards, include `### Simplicity and test value` with findings or, only after a completed check, an explicit "no justified simplification found". Name required complexity retained when it was a plausible removal candidate. Keep unconfirmed plan assumptions within Spec, separate from compliance failures.

Before accepting the reports, compare the captured input identities with the current intended review inputs. Code, scope, contract, or requirement changes make the reports stale for the new state. Preserve them as historical findings, capture the changed inputs, and re-review affected axes; both axes must cover the final shared snapshot before claiming a completed two-axis review. The implementation session verifies findings, makes authorized repairs, and runs relevant verification. It requests re-review after repairs rather than editing underneath active reviewers.

End with one line giving status, finding count, and worst issue within each axis. A blocked or skipped axis is not a pass and has no zero-findings claim. Do not pick a single winner across axes.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
