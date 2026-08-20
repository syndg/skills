---
name: dox
description: DOX-first repository context retrieval and maintenance. Use whenever working in a repository with dox.config.json, or when the user asks to initialize, migrate, query, lint, or capture a decision, contract, or invariant in DOX. In a configured repository, invoke it before repository research or code work—including read-only questions, planning, debugging, review, and implementation—so decisions, contracts, invariants, ownership, and change impact come through the resolver rather than broad record-store inspection.
---

# DOX

Use DOX as the repository's structured context seam. Records are Markdown with YAML frontmatter and are selected by deterministic evidence, not by broad instruction-file fallbacks.

## Start safely

Run commands from the target Git worktree:

```bash
dox init
dox init --apply
```

`init` prints its proposal first. Only `--apply` writes the config, record directory, migration manifest, and an ignored cache directory. It does not invent an invariant ledger.

## DOX-first

In a configured repository, query DOX before repository research or code work, including read-only tasks. Start with the narrowest available cue:

```bash
dox resolve --path src/payments/charge.ts --intent "authorize a charge" --json
dox resolve --intent "trace sign-in" --symbol authorize --json
dox search "authorization"
dox resolve --changed --json
```

Refine through the CLI until the receipt accounts for the task's known paths and intent plus every applicable owner, decision, contract, binding invariant, and dependency. Then use the returned paths and symbols to guide targeted source inspection. A context pass is complete only when those receipt-backed records are reflected in the plan or answer.

Keep structured-record retrieval inside `dox resolve` and `dox search`. Direct record access is only for editing a specifically resolved record or maintaining DOX itself; never enumerate, grep, or bulk-read the configured record directory.

An empty search receipt switches the next step to source-path discovery outside the configured record directory, followed by one path-plus-intent resolution. One search per domain concept is enough; avoid synonym sweeps that add calls without adding evidence.

Read the receipt as evidence: `reason` says what matched and `edge` says whether it was a record path, enforcement binding, or dependent relationship. A path that hits invariant enforcement returns its full binding; a dependent path returns an impact summary.

## Record shape

Create records under the configured `records_dir` (default `dox/records`). Use the schema in [references/record-schema.md](references/record-schema.md). Every record needs a stable `id`, a single accountable `owner`, and a Markdown body. Path patterns are repository-relative globs.

For an invariant, record its enforcement target, verification, failure modes, impact, criticality, state, and dependency edges. The precision makes a change-impact answer actionable rather than merely descriptive.

Use `kind: decision` plus a globally unique four-digit `adr` for full architectural decision bodies. In a DOX project, do not retain a parallel `DECISIONS.md`. Proposed invariants remain nonbinding; accepted or enforced invariants must name their enforcement classes, targets, and verification. Unknown schema fields and incomplete binding records fail closed.

## Verify the seam

```bash
dox lint
dox lint --json
```

Treat errors as blockers. Lint checks strict record and config structure, ownership, path coverage when configured, references, unique four-digit ADR records, invariant enforcement, dependency patterns, and stale symbols. It also rejects parallel decision sources.

## Boundaries

DOX is a direct-cutover store: read its configured records only. Do not add another-source readers, instruction-file fallbacks, compatibility shims, or runtime content conversion. Refuse ambiguous critical ownership, unsafe paths, and symlink escapes instead of guessing.
