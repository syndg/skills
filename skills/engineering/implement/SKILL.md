---
name: implement
description: "Implement an approved spec or explicit issue scope, verify the work, and own the independent review and repair loop."
disable-model-invocation: true
---

Implement the approved work in the current session. The user selects the implementation model outside this skill; skill instructions do not switch models.

When `dox.config.json` exists, follow the installed `/dox` skill for retrieval eligibility, context reuse across implementation and delegated TDD, and maintenance. The closing `/mp-code-review` follows the same policy for the actual work under review. Without DOX, read the applicable root-to-nearest `AGENTS.md` chain and indexed co-located `DECISIONS.md` entries when project contract context is needed.

## 1. Resolve the approved scope

Accept a full spec issue URL, a repository-qualified or bare issue number, an explicit issue scope, an existing local spec, or an agreed plan in the conversation. Splitting a spec into issues is not a prerequisite. Resolve numbers through the supplied repository and issue-tracker context, never an unrelated numbered list. Identify the source and title before editing; ask only when the intended source cannot be resolved.

For tracker-based work, fetch the issue body and relevant comments through the project's issue-tracker workflow. Follow linked spec or decision sources needed for an explicitly scoped issue. The body is the canonical current approved scope; comments record progress, deviations, reviews, and later decisions. Reconcile approved decisions and their rationale with the body, folding approved requirement changes back into it before proceeding. Conflicting or unapproved changes need a user decision, not an inferred scope change. Keep remote tracker work in the tracker, without a local plan mirror.

Separate requirements, acceptance criteria, and settled contracts from proposed implementation details. Read the ordered plan and inspect its referenced paths, symbols, and grounding revision against the current code. Adjust stale implementation assumptions when the approved behavior and contracts stay intact; record the deviation and reason. Escalate changes to scope, acceptance, or settled design to the user.

Work on the entire spec unless the user explicitly chose a narrower scope. Do not split work into sub-issues because it looks large or invoke the user-only `/to-tickets` skill.

## 2. Establish the working boundary

Record the current branch and HEAD, a fixed review baseline, and the starting staged, unstaged, and untracked state. Use the starting HEAD for new work unless the user supplies another baseline; include earlier feature work only when it is explicitly in scope. Track owned paths and hunks separately from pre-existing user changes, including changes within the same file. Preserve those changes without stashing, resetting, staging, or committing them. If ownership cannot be separated safely, resolve the boundary with the user before editing that part.

Capture the requested review-model preference from the user's instructions or project configuration, with an explicit user choice taking precedence. Carry it unchanged to `/mp-code-review`; if neither specifies one, use that skill's standalone defaults. Model routing is an environment capability, not something prose can guarantee.

## 3. Implement and verify

Follow the approved plan in order, using existing code and conventions. The implementation session owns edits, runtime verification, and repairs. Use `/tdd` where appropriate at pre-agreed seams; resolve any missing seam agreement through that skill rather than inventing it. Keep project-required checks. Run typechecking and focused tests regularly, then the full test suite at the end of implementation.

Exercise the changed behavior in the actual runtime where possible. Record which acceptance criteria the evidence demonstrates, the commands or interactions used, their results, and any checks that could not run. A passing test suite is not evidence for an unexercised acceptance criterion.

Before review, account for the full approved scope, update affected documentation and contract records through the selected contract route, and record implementation deviations without rewriting acceptance to fit the code.

## 4. Run the independent review and repair loop

Invoke `/mp-code-review` directly from this implementation session before the final commit. Do not add an intermediary coordinator. Supply:

- The issue or spec identity and the same approved requirements snapshot for both review axes, including decision provenance, acceptance criteria, and the distinction between settled contracts and proposed implementation details.
- The fixed baseline, starting working-tree state and exclusions, and exact owned paths or hunks. Include the current staged, unstaged, and owned untracked work, plus any explicitly in-scope commits.
- The designated review model, if any, and the verification evidence, deviations, and known limitations.

`/mp-code-review` owns capability checks, the review input snapshot, and direct independent Standards and Spec review contexts. Both reviews are read-only. Keep its two reports separate, without hiding or reranking findings across axes.

If the required model or an independent review context is unavailable, include that skill's portable review briefs in the blocked status report from step 5, including the issue comment for tracker-based work. Do not substitute implementer self-review or a different model, or claim completion. Resume the loop when the required independent reports are available.

Repair evidenced in-scope defects in the implementation session. Explain disputed findings with evidence; ask the user to decide scope or contract changes and design disputes rather than silently accepting or dismissing them. Rerun affected checks and runtime verification after repairs, then request relevant independent re-review through `/mp-code-review`. Refresh the shared requirements snapshot when the user approves a change. The loop is complete only when the final owned changes have the required review coverage and no unresolved blocking findings or gates.

## 5. Report and commit when authorized

Report the implemented scope, actual verification evidence, deviations, separate Standards and Spec outcomes, and any unresolved decisions or blockers. For tracker-based work, post this evidence and status in an issue comment. If posting fails, provide the intended comment and report the failure. Mark acceptance criteria complete only when supported by evidence; close the issue only when the user or repository workflow authorizes it and every required gate is satisfied.

Commit only after verification and independent reviews pass, and only when the user or repository workflow authorizes it. Stage only owned changes on the intended branch, preserving pre-existing user work. Otherwise leave the reviewed changes uncommitted and say so. A commit does not imply permission to push or open a pull request.
