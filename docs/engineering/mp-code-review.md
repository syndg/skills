## What it does

`mp-code-review` reviews a captured change along two independent axes. **Standards** checks repository conventions, architectural burden, and test value. **Spec** checks the originating issue or [spec](https://www.aihero.dev/ai-coding-dictionary/spec), separating approved requirements from unconfirmed implementation assumptions. Each axis receives the same code and requirements snapshot in a fresh [subagent](https://www.aihero.dev/ai-coding-dictionary/subagent) context. Neither sees the other's reasoning.

The reports stay separate. Code can follow every convention and still implement the wrong thing; it can satisfy the issue and still break the project's conventions. A blended verdict hides that distinction. The review recommends changes but does not edit code, delete tests, or authorize a commit.

## When to reach for it

Type `/mp-code-review`, or the agent reaches for it automatically when you ask to review a branch, a PR, work in progress, or anything "since X".

| Your situation | Reach for |
| --- | --- |
| You want a change checked against both standards and requirements | `mp-code-review` |
| You want a general hunt for null paths, races, or off-by-one errors | A general bug-finding review rather than this two-axis review |
| Nothing is written yet and you want it written test-first | [tdd](https://aihero.dev/skills-tdd) |
| A whole spec needs building, review included | [implement](https://aihero.dev/skills-implement), which runs this skill directly |
| The whole codebase has drifted, not one change | [improve-codebase-architecture](https://aihero.dev/skills-improve-codebase-architecture) |
| Something is broken and you do not know why | [diagnosing-bugs](https://aihero.dev/skills-diagnosing-bugs) |

Supply a fixed point and any scope limits. An invoking workflow can supply them for you. The skill asks when the baseline is missing rather than guessing which changes you meant.

## Prerequisites

Standards needs a non-empty scoped code snapshot. Configured repositories follow [dox](https://aihero.dev/skills-dox)'s retrieval, reuse, and delegated-context policy. Without DOX, the changed paths' root-to-nearest `AGENTS.md` chains and indexed co-located `DECISIONS.md` entries provide the fallback. The built-in smell baseline and [ponytail](https://aihero.dev/skills-ponytail) simplicity principles still apply when the repository documents no standards.

Spec needs an authoritative source. The lookup order is:

1. The issue URL or number, spec path, or approved snapshot you or the invoking workflow supplied.
2. An originating issue inferred from commit references through the configured issue-tracker workflow.
3. A matching spec under `docs/`, `specs/`, or `.scratch/`.
4. Asking you.

An issue review uses its full body and relevant comments, not its title or a preview. [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) supplies the issue-tracker workflow when the project has none. A supplied spec can also be reviewed directly.

| Missing prerequisite | Result |
| --- | --- |
| You confirm there is no spec | Spec is skipped, with "no spec available" in the report |
| A required spec cannot be retrieved | Spec is blocked, not replaced by inferred requirements |
| Independent execution or verifiable routing to your designated model is unavailable | Portable per-axis briefs for separate sessions; review remains pending |
| No review model was designated | Independent reviewers use the environment's normal default |

## One snapshot, two review modes

| Mode | What reviewers see |
| --- | --- |
| Committed | The requested branch changes from the merge-base to captured `HEAD`, excluding all uncommitted work |
| Working-tree | The scoped committed changes plus staged, unstaged, and untracked contents at capture time; use `HEAD` as the fixed point for uncommitted work only |

The merge-base keeps unrelated changes on the base branch out of the review. Path and hunk limits still apply. Untracked-only work counts as a real change, and new files are read without staging or committing them. Starting user edits are excluded through the implementation's ownership record, even inside shared files. An inseparable overlapping hunk needs a scope decision; it is not permission to absorb or revert the user's work.

Both axes receive a reusable snapshot with the resolved revisions, scope, exclusions, commit list, patch, extra file contents, requirements, and verification evidence. Edits pause during review. A changed requirement or code snapshot makes the old report stale for the new state, so repairs need relevant verification and re-review. A remote issue remains canonical; the captured review evidence is not a second local plan.

## The two axes

| | Standards | Spec |
| --- | --- | --- |
| Question | Is it built right? | Is it the right thing? |
| Reads | Resolved contracts, standards documents, smell baseline, simplicity check, and preservation constraints | The originating issue or spec, approval provenance, and resolved binding constraints |
| Reports | Documented breaches, possible smells, and justified simplifications | Missing or partial requirements, scope creep, incorrect implementations, and separately labelled unconfirmed assumptions |
| Every finding cites | The rule or named concern and file/hunk; simplifications explain cost, alternative, preserved behavior, and verification | The authoritative requirement; an unconfirmed assumption is not a compliance failure |

The resolved project contract and repository documentation are the [primary sources](https://www.aihero.dev/ai-coding-dictionary/primary-source) for Standards. Repository standards override the smell baseline. Spec uses the same contract context to understand terms and constraints, not to invent requirements absent from the spec.

The **smell baseline** covers twelve Fowler code smells from *Refactoring*, chapter 3: Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, and Refused Bequest. They are investigation prompts, not automatic violations or instructions to add abstractions. Tooling-enforced style findings are skipped.

Standards always includes a `Simplicity and test value` subsection. It examines duplicate owners, forwarding layers, speculative frameworks, unnecessary persistence or recovery work, unreliable defensive heuristics, and tests that protect no observable behavior. Fewer files or tests is not the goal. Multiple required providers and meaningful authorization, concurrency, failure, and recovery coverage stay intact. Exact wording or bytes can also be legitimate protocol requirements.

The issue body holds current approved requirements and settled decisions alongside a detailed plan. Comments record progress, deviations, and reviews; approved requirement changes belong back in the body. Proposed implementation details do not become requirements merely by appearing in a plan. A simplification that changes a settled contract needs your decision, not a quiet scope reduction.

## Common questions

**Can the implementation session run the reviews, or do I need a review coordinator?**

The implementation [session](https://www.aihero.dev/ai-coding-dictionary/session) runs this skill and dispatches both reviewers directly. There is no extra coordinator. Independence comes from separate fresh reviewer contexts with captured evidence, not from making the implementing agent pretend to be a reviewer. Each reviewer performs its own assigned axis without invoking this skill again or spawning more agents. You can still start a fresh standalone review session.

**Does naming a review model make the reviewers use it?**

No. Model selection is an environment capability. The skill resolves your designation, or the project's designation, through the available routing controls and checks configuration or execution metadata for each reviewer. A model claiming its own identity is not proof. If routing is unavailable or unverifiable, you receive self-contained briefs for separate user-run sessions on that model. Neither self-review nor a quiet switch to another model counts as completion. With no designation, the default remains usable.

**Does it review my uncommitted work?**

Yes, in working-tree mode. This includes actual untracked file contents, not just staged and unstaged diffs. You do not need an interim commit. Committed mode deliberately excludes uncommitted work, and the report names the mode and scope it covered.

**After each issue, or once at the end?**

Both work. Per-issue review keeps requirements and scope focused; an end-of-branch pass can catch interactions between changes. One spec issue is enough for the planning-to-implementation handoff. Splitting it into sub-issues is a separate user choice, not a review prerequisite.

**Can I trust the findings?**

Check the citations before acting. Reports keep evidence-backed defects, design suggestions, and unresolved questions distinct, but a cited claim can still be wrong. The implementation session owns verification and authorized repairs. Scope, contract, and design disputes go back to you. Relevant re-review checks repairs; there is no promise that repeated judgement calls converge to an empty report.

## It's working if

- Both reports name the same code and requirements snapshot, with the intended mode and scope.
- New untracked files appear in working-tree review without staging or an interim commit.
- Each axis is marked completed, blocked/pending, or skipped. A blocked model route is visible rather than reported as a pass.
- Standards findings cite rules, named smells, or evidenced simplicity concerns. Spec failures quote approved requirements rather than plan assumptions.
- The simplicity check can say no justified simplification was found and explain why required complexity stays.
- The closing summary gives a status and worst issue per axis, never one blended verdict.

## Where it fits

`mp-code-review` is a build-chain step and a standalone review tool. In the two-session workflow, planning produces one approved spec issue; a fresh [implement](https://aihero.dev/skills-implement) session builds it, runs this skill directly, verifies findings, and repairs in-scope defects before a permitted final commit.

[to-spec](https://aihero.dev/skills-to-spec) produces the canonical spec the review checks. [to-tickets](https://aihero.dev/skills-to-tickets) splits work only when you request sub-issues. [improve-codebase-architecture](https://aihero.dev/skills-improve-codebase-architecture) handles whole-codebase architecture rather than this skill's bounded change review.

[ask-matt](https://aihero.dev/skills-ask-matt) routes across the skill set when you are unsure which one fits.
