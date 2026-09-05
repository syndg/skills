---
name: dox
description: DOX repository meaning and contract maintenance. In repositories with dox.config.json, use before substantive design or behavioral changes, for intended-meaning and ADR questions, and after substantive content changes. Reuse loaded context within the same task and scope. Also use for explicit DOX initialization, migration, retrieval, lint, or recording settled meaning. Skip source-fact lookups, Git-only actions, external tooling, and runtime commands.
---

# DOX

This skill owns when to load, reuse, and maintain DOX context. Other skills and repository instruction files point here rather than copying the procedure. Configured records hold intended meaning; source, configuration, tests, and runtime own current facts.

## Choose the right source

Run commands from the target Git worktree. A `dox.config.json` selects canonical DOX records, not a parallel `AGENTS.md` or `DECISIONS.md` contract ledger.

- For substantive design or behavioral change, load the applicable curated brief before making design choices or changing behavior. Reviews of such work use its actual paths.
- For questions about intended meaning, domain boundaries, governing obligations, or an ADR, load the scope brief before answering. Use named retrieval for any additional context or rationale.
- For current implementation facts, file locations, package scripts, configuration, test commands, Git state, external tools, or current runtime behavior, inspect the source that owns the fact directly. DOX is not a prerequisite to source discovery, launching a server, or checking connectivity.
- For questions about how to invoke DOX, reuse context, or maintain records, answer from this loaded skill. Retrieve project context only if the answer requires repository-specific facts or the user asks for an actual record change. A stipulated or hypothetical product example is not a request to audit its implementation.
- If a fact-finding task becomes a design or meaning task, load context at that boundary. Read-only status alone does not decide eligibility.

Source discovery may precede the brief to identify the relevant paths. Discover those paths outside the configured record directory. Keep the user's requested deliverables and verification obligations in the working plan; do not turn the whole user prompt into a search query.

## Load a curated brief

```bash
dox brief --path src/auth/login.ts --path src/auth/session.ts
```

Choose concrete task paths. Use `--path .` only for genuinely repository-wide meaning, not as a substitute for finding a narrower scope.

A brief deterministically assembles canonical record bodies in curated scope order, inheriting root-to-nearest and deduplicating membership. It delivers full standing meaning, complete applicable binding invariant tuples, and an ADR title/index whose full rationale remains available on demand. It is neither an LLM summary nor a second authored ledger.

The scope's standing context and a path's obligations are different. Scope membership selects shared meaning; explicit applicability paths, enforcement targets, dependent paths, and declared graph edges select additional relevant obligations. An accountable `owner` alone does not make an ordinary record or invariant apply to that owner's whole subtree.

No matching scope is an explicit missing-scope failure, not permission to substitute lexical search or the AGENTS fallback. Check the target path; if correct, report the curation gap and establish the missing scope through an approved DOX maintenance change before governed work proceeds. Do not invent product policy to fill it.

Default output is readable wrapped text. Use `--json` only when structured output is needed. Both forms are atomically budgeted. Full selected standing context and applicable bindings cannot be silently truncated; a budget failure states the required bytes. Increase `--max-bytes` enough to receive the complete result rather than dropping required knowledge.

The default ceiling is 128 KiB for a brief, 16 KiB for named retrieval, and 64 KiB for expansion. A brief emits only its curated bodies, applicable bindings, and decision index; spare budget does not pull in supplementary excerpts.

Check the tool response for clipping before using the brief. CLI budget success and receipt completeness describe DOX's serialized output, not what the harness displayed. If the tool supplies a full-output artifact or continuation, read every omitted range through that reference before designing, editing, or completing the maintenance review. Recover the existing output rather than rerunning the brief or projecting away fields. An unrecoverable required body blocks governed work.

## Reuse context and retrieve only what is missing

Within the same task and worktree, reuse the standing meaning already loaded for the same scope. A follow-up, another skill, or another file within that scope does not require a fresh generic brief. Check newly touched paths for their own applicable bindings when necessary; load only new scope context when the work crosses a material domain, dependency, or ownership boundary. Refresh affected context when its records change or a receipt is stale.

Use `resolve` for an additional named term, domain, contract, or decision, not generic NLP over the task:

```bash
dox resolve "authorization" --path src/auth/login.ts
dox resolve "ADR-0002"
dox resolve --from <receipt-id> --expand <record-id>
```

Path and changed-path cues select applicable change context. With path cues, unrelated task-only matches must not displace that context. Inspect returned titles and evidence before requesting a body. Expand discovered IDs through their local receipt; batch the bodies actually needed into one expansion command. A brief's standing bodies are already loaded, so do not expand them again. Full ADR rationale uses receipt-backed expansion.

Keep record retrieval inside `dox brief`, `dox resolve`, and receipt expansion. Do not enumerate, grep, or bulk-read the record directory to answer ordinary project questions. Once retrieval identifies an owning record and supplies its full body, direct access may write that file for a semantic update. Direct record reads are reserved for maintaining DOX itself.

A receipt is a local manifest, not loaded prose or portable authority. A same-worktree delegate may receive already-loaded applicable content under this skill's reuse rules. Cross-worktree handoffs carry the task and paths and direct the recipient to this skill; supplied content is only a hint until locally grounded. A recipient without repository access must disclose that limitation rather than treating hints as current authority.

## Carry the complete contract

Read the full delivered standing bodies and every field of each binding invariant. Preserve statement, enforcement, targets, dependencies, verification, failure modes, impact, criticality, and state. Do not pipe the result through `jq` or another projection that discards invariant fields before reading them.

Carry each applicable obligation and prohibited behavior into the work and its verification. Preserve distinctions that affect the answer; a summary must not erase one obligation by merging it with another. If a failure mode requires clarification, ask explicitly for each missing field it names.

`binding_complete` describes the delivered applicable binding set under the recorded evidence. It is not a semantic-recall guarantee: missing scope membership, paths, or dependency edges can leave real obligations undiscovered. Deferred titles identify available optional context, not permission to ignore a relevant decision. When source exposes a new boundary or contradiction, inspect the additional named context and report the gap.

When implementation and DOX disagree, state both the observed behavior and the intended contract. Do not silently rewrite intended meaning to match code, or describe unimplemented intent as working behavior. Use `/domain-modeling` when the meaning itself needs adjudication.

## Review and maintain the actual work

After substantive repository content changes, review their impact once against the loaded meaning and current applicable bindings. Select the paths changed by this task, not incidental edits elsewhere in the worktree or unrelated commits on the branch:

This is a meaning review, not a mandatory second CLI call. Reuse context when its records and the actual paths' bindings are already loaded and current. The following command is for changed paths that introduce context or obligations not yet loaded:

```bash
dox brief --path src/auth/login.ts --path src/auth/login.test.ts
```

Use changed-path selection only when the requested work intentionally includes the entire selected diff:

```bash
dox brief --changed
dox brief --changed --base origin/main
```

Inspect a path-limited diff separately for a path-limited review. Combine explicit paths with `--changed` only when their union is intended. Preserve the original task's acceptance criteria and verification obligations during review. Skip another pass for staging, committing, or the same unchanged diff.

Check both kinds of maintenance need:

- Correct a record, applicability edge, or scope membership that the work proved false or incomplete.
- Capture newly settled durable meaning, such as a canonical term, domain boundary, behavioral contract, or obligation, even when no existing record is false. Record only meaning the user settled or approved, not an inferred product policy. Use an ADR for optional rationale when a hard-to-reverse, surprising choice involved a real trade-off; ordinary standing meaning does not need an ADR to be durable.

Update the existing canonical owner rather than adding a duplicate summary. Create a record only for a confirmed gap. Keep standing meaning in scope context, binding obligations in invariant fields, and optional decision rationale in decision records. Curate membership/order by ID; do not copy bodies into config or an AGENTS ledger. Read [references/record-schema.md](references/record-schema.md) before changing records or scope configuration.

After record or scope edits, run `dox lint` and retrieve the affected scope or paths to check that the intended content is delivered. Lint errors block completion. Successful lint proves structure, not semantic agreement.

## Initialize only on request

An existing configured repository starts with the workflow above, not initialization. Only when the human asks to initialize DOX, preview:

```bash
dox init
# After the human reviews and approves the proposal:
dox init --apply
```

Only `--apply` writes the config, record directory, migration manifest, and ignored cache directory. Initialization does not invent standing meaning or binding invariants. Curate scopes from approved canonical records before expecting a brief.

## Structural checks

```bash
dox lint
dox lint --json
dox brief --help
dox resolve --help
```

Lint checks strict schema, references, scope membership, accountability, configured coverage, ADR uniqueness, binding completeness, dependency patterns, and stale symbols. Unsafe paths, symlink escapes, ambiguous critical ownership, and invalid references fail closed. Configured repositories keep no compatibility reader or fallback contract store.
