---
name: dox
description: Use this skill whenever a repository needs durable, queryable engineering context rather than scattered Markdown guidance. It creates and operates a DOX record store for decisions, contracts, invariants, ownership, path-aware implementation context, change-impact resolution, and repository documentation linting. Trigger for requests to initialize DOX, find the records relevant to files or a change, resolve an intent/symbol/term/ADR, capture an invariant with enforcement and dependents, audit record quality, or replace ad-hoc repository guidance with a direct DOX cutover. Use it proactively before implementation when context may constrain a touched path.
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

## Query before changing code

Resolve using the narrowest available cue:

```bash
dox resolve --path src/payments/charge.ts
dox resolve --changed --json
dox resolve --symbol authorize --intent signin
dox search authorization
```

Read the receipt as evidence: `reason` says what matched and `edge` says whether it was a record path, enforcement binding, or dependent relationship. A path that hits invariant enforcement returns its full binding; a dependent path returns an impact summary.

## Record shape

Create records under the configured `records_dir` (default `dox/records`). Use the schema in [references/record-schema.md](references/record-schema.md). Every record needs a stable `id`, a single accountable `owner`, and a Markdown body. Path patterns are repository-relative globs.

For an invariant, record its enforcement target, verification, failure modes, impact, criticality, state, and dependency edges. The precision makes a change-impact answer actionable rather than merely descriptive.

## Verify the seam

```bash
dox lint
dox lint --json
```

Treat errors as blockers. Lint checks record structure, ownership, path coverage when configured, references, ADR and contract links, invariant enforcement, dependency patterns, and stale symbols. Warnings do not change the exit status.

## Boundaries

DOX is a direct-cutover store: read its configured records only. Do not add another-source readers, instruction-file fallbacks, compatibility shims, or runtime content conversion. Refuse ambiguous critical ownership, unsafe paths, and symlink escapes instead of guessing.
