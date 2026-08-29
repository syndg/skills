---
name: dox
description: DOX repository contract retrieval and maintenance. Use in a repository with dox.config.json when nonlocal decisions, contracts, invariants, ownership, dependencies, or change impact may govern repository research or code work, and once after substantive repository content changes. Also use when the user asks to initialize, migrate, query, lint, or capture a decision, contract, or invariant in DOX. Skip external tooling, runtime connectivity checks, Git-only actions, and ordinary follow-ups within an already-resolved task.
---

# DOX

Use DOX as the repository's structured context seam. Records are Markdown with YAML frontmatter and are selected by deterministic evidence, not by broad instruction-file fallbacks.

## Start safely

Run commands from the target Git worktree. Existing configured repositories start with resolution below; do not initialize them again.

Only when the human explicitly asks to initialize DOX, preview the proposal first:

```bash
dox init
# After the human reviews and approves the proposal:
dox init --apply
```

`init` is read-only. Only `--apply` writes the config, record directory, migration manifest, and an ignored cache directory. It does not invent an invariant ledger.

## Establish governing context

In a configured repository, resolve once before work that may be governed by ownership, decisions, contracts, binding invariants, dependencies, or change impact. Typical cases are planning, debugging, review, implementation, and read-only investigation of repository behavior. The purpose is to surface constraints outside the source immediately in view.

Do not open a new pre-work resolution for external tooling, runtime connectivity or status checks, Git-only actions, or an ordinary follow-up within a task whose governing context is already established. A follow-up that changes repository content receives only the change-impact review below. For facts owned by source, tests, configuration, scripts, runbooks, or current runtime state, inspect that owner directly. Resolve first only when recorded contract context may govern the task.

Give the resolver one natural-language task and any known paths:

```bash
dox resolve "authorize a charge without bypassing payment policy" --path src/payments/charge.ts
dox resolve "trace the sign-in boundary" --path src/auth/login.ts --path src/auth/session.ts
dox resolve "review the authorization changes" --changed
dox resolve "review changes since the release branch" --changed --base origin/main
```

Preserve the user's requested deliverables and constraints in the task string, not only the code subject. Include ambiguity or clarification needs when requested. For plans and reviews, include applicable testing and verification obligations. If no source path is known, omit `--path`; never use `--path .`, because the repository root is not a narrow applicability cue. For a review scoped to named paths, resolve those paths without `--changed`; inspect the path-limited Git diff separately. Combine `--changed` with explicit paths only when the task intentionally covers both the named paths and every repository change since the selected base.

The normal result is canonical compact JSON. It contains ranked record capsules, bounded relevant excerpts, complete accepted or enforced invariant bindings, evidence edges, deferred record IDs, and a deterministic receipt. The default 16,384-byte budget removes optional capsules before mandatory knowledge. If complete mandatory context cannot fit, resolution fails with `DOX_BUDGET_TOO_SMALL`; it never returns a partial invariant binding.

## Retrieval boundary

DOX answers the questions its record corpus is built to hold: applicable ownership, decisions, contracts, binding invariants, dependencies, and change impact. Its job is to surface governing context that may live outside the source path immediately in view. Establish that context once per task, not once per prompt.

Treat the resolution as constraints on the task, not as a substitute for current repository truth. Records may deliberately name enforcement symbols, verification commands, or operational constraints; carry those forward. For a needed fact that the capsules do not state, use the source that owns it: source and tests for behavior, package scripts and runbooks for procedures, configuration for declared settings, and runtime inspection for current state.

The single task-plus-path retry below establishes whether records apply after source discovery. Once governing context is established, continue with targeted repository work.

Use the returned paths and symbols for targeted source inspection. If you need a full body, expand only a discovered ID from its receipt:

```bash
dox resolve --from <receipt-id> --expand <record-id>
```

Expansion returns only newly requested bodies and a child receipt. Stale receipts, unknown IDs, repeated expansions, and over-budget expansions fail closed.

Keep structured-record retrieval inside `dox resolve`. Do not enumerate, grep, or bulk-read the configured record directory. After resolution identifies a specific record, direct access may write that file for an approved semantic edit, but any full-body read must first use `dox resolve --from <receipt-id> --expand <record-id>`. Direct record reads are reserved for maintaining DOX itself.

If the result has no useful capsule, discover a relevant source path outside the configured record directory, then run one new task-plus-path resolution. Do not perform synonym sweeps or repeated overlapping calls. Treat `receipt.deferred` as an explicit signal that optional details remain available, not as silent truncation. When several discovered bodies are necessary, request their IDs in one expansion command. Start another expansion round only when the first expansion establishes a new conflict or dependency.

Read each capsule's `evidence`: `source` identifies task, path, changed-path, binding, or graph evidence; `edge` identifies the matched field or relationship. A path that hits invariant enforcement returns the complete binding tuple. A dependent path returns the same invariant with dependent relation evidence.

Treat every field in a returned binding invariant as required knowledge. Carry its failure modes, enforcement, dependencies, and verification into the plan or answer when they affect the task; do not reduce the invariant to its statement. Preserve each distinct applicable obligation and prohibited behavior in the final answer. Do not combine an enumerated requirement when the combination removes one of its fields. When a failure mode names information that must be clarified before work proceeds, ask for every named field explicitly as a checklist rather than collapsing the fields into one broad question.

## Review substantive changes

After substantive repository content changes, run one change-impact resolution from the target worktree. Reuse the original task and its verification obligations so ranking retains the work's intent. For example:

```bash
dox resolve "review the login authorization change and its required tests" --changed
```

Use `--base <revision>` when the requested review covers a branch or another fixed point. This pass replaces another generic pre-commit resolution; it does not add one. Skip it when no repository file content changed, when the action was Git-only, or when the same unchanged diff has already been reviewed. After DOX record changes, also run `dox lint`.

## Record shape

Create records under the configured `records_dir` (default `dox/records`). Use the schema in [references/record-schema.md](references/record-schema.md). Every record needs a stable `id`, a single accountable `owner`, and a Markdown body. Path patterns are repository-relative globs.

For an invariant, record its enforcement target, verification, failure modes, impact, criticality, state, and dependency edges. The precision makes a change-impact answer actionable rather than merely descriptive.

Use `kind: decision` plus a globally unique four-digit `adr` for full architectural decision bodies. In a DOX project, keep decisions only in DOX records. Lint rejects parallel `DECISIONS.md` files and actual ADR entries in index-tracked `AGENTS.md` files while allowing explicit DOX pointers and inert Markdown examples.

Every contract name belongs to one record, and every contract relation must resolve to a declared contract rather than an arbitrary record ID. Proposed invariants remain nonbinding; accepted or enforced invariants must name their enforcement classes, targets, and verification. Unknown schema fields, ambiguous declarations, and incomplete binding records fail closed.

## Verify the seam

```bash
dox lint
dox lint --json
```

Treat errors as blockers. Lint checks strict record and config structure, ownership, path coverage when configured, references, unique four-digit ADR records, invariant enforcement, dependency patterns, and stale symbols. It also rejects parallel decision sources in index-tracked `DECISIONS.md` and `AGENTS.md`.

## Boundaries

DOX is a direct-cutover store: read its configured records only. Do not add another-source readers, instruction-file fallbacks, compatibility shims, or runtime content conversion. Refuse ambiguous critical ownership, unsafe paths, and symlink escapes instead of guessing.
