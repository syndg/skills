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

In a configured repository, query DOX before repository research or code work, including read-only tasks. Give the resolver one natural-language task and any known paths:

```bash
dox resolve "authorize a charge without bypassing payment policy" --path src/payments/charge.ts
dox resolve "trace the sign-in boundary" --path src/auth/login.ts --path src/auth/session.ts
dox resolve "review the authorization changes" --changed
dox resolve "review changes since the release branch" --changed --base origin/main
```

The normal result is canonical compact JSON. It contains ranked record capsules, bounded relevant excerpts, complete accepted or enforced invariant bindings, evidence edges, deferred record IDs, and a deterministic receipt. The default 16,384-byte budget removes optional capsules before mandatory knowledge. If complete mandatory context cannot fit, resolution fails with `DOX_BUDGET_TOO_SMALL`; it never returns a partial invariant binding.

Use the returned paths and symbols for targeted source inspection. If you need a full body, expand only a discovered ID from its receipt:

```bash
dox resolve --from <receipt-id> --expand <record-id>
```

Expansion returns only newly requested bodies and a child receipt. Stale receipts, unknown IDs, repeated expansions, and over-budget expansions fail closed.

Keep structured-record retrieval inside `dox resolve`. Do not enumerate, grep, or bulk-read the configured record directory. Direct record access is only for editing a specifically resolved record or maintaining DOX itself.

If the result has no useful capsule, discover a relevant source path outside the configured record directory, then run one new task-plus-path resolution. Do not perform synonym sweeps or repeated overlapping calls. Treat `receipt.deferred` as an explicit signal that optional details remain available, not as silent truncation.

Read each capsule's `evidence`: `source` identifies task, path, changed-path, binding, or graph evidence; `edge` identifies the matched field or relationship. A path that hits invariant enforcement returns the complete binding tuple. A dependent path returns the same invariant with dependent relation evidence.

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
