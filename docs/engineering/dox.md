## What it does

`dox` is the **DOX-first** context seam for repositories that keep engineering contracts as structured records. Before an agent researches or changes the repository—even for a read-only question—it resolves the applicable ownership, decisions, contracts, binding invariants, and dependencies, then uses that receipt to guide targeted source inspection.

Its defining constraint is structural: `dox` retrieves and validates records, but it does not adjudicate what a term, relationship, or decision means. Use [domain-modeling](https://aihero.dev/skills-domain-modeling) for that semantic work.

## When to reach for it

Type `/dox`, or the agent reaches for it automatically whenever it works in a repository with `dox.config.json`.

In a configured repository, reach for it before research, planning, debugging, review, or implementation. Give `dox resolve` one natural-language task plus any known paths or changed-file cues. The CLI performs normalization, ranking, relationship closure, deduplication, and budgeting; agents do not enumerate the record directory or make overlapping synonym queries. For ambiguous terminology or deciding whether a trade-off deserves a durable decision, use [domain-modeling](https://aihero.dev/skills-domain-modeling) instead.

## Prerequisites

Resolution requires a project-local `dox.config.json` and its configured records. Project setup is always explicit: inspect `dox init`, then run `dox init --apply` only when you intend to initialize the current repository. Installing or invoking the skill never initializes a project automatically.

## Retrieval interface

```bash
dox resolve "change login authorization without bypassing policy" --path src/auth/login.ts
dox resolve "review changed authorization behavior" --changed --base origin/main
dox resolve --from <receipt-id> --expand <record-id>
```

Normal retrieval returns canonical compact JSON under a 16,384-byte default budget. Capsules include a summary, a bounded task-relevant excerpt, evidence, provenance, and body digest. Accepted and enforced invariants include their complete binding tuple. Optional records that do not fit are named in `receipt.deferred`; mandatory context is atomic, so an undersized budget fails instead of truncating a binding.

Full bodies stay behind receipt-backed expansion. Expansion returns only newly requested bodies and a child receipt. Unknown record IDs, repeated expansion, stale corpus receipts, unsafe receipt-cache paths, and outputs that exceed the expansion budget fail closed.

## The contract layer

`dox` is the automatic **contract-retrieval and structural-validation** layer underneath engineering flows. DOX-first keeps structured-record discovery inside the CLI, returns a receipt-backed context bundle, and directs the agent toward only the source paths and symbols needed to verify behavior.

Resolution also surfaces optional source path, heading, and digest metadata, so migrated records remain traceable to the exact frozen source section without reading a second runtime source.

Records use a versioned, closed schema. Each record has one owner and a Markdown body; unknown fields and incomplete binding records fail closed. Invariants capture enforcement targets, dependent consumers, verification, failure modes, impact, criticality, and lifecycle state. Proposed invariants are nonbinding until accepted or enforced.

Architectural decisions are full `decision` records identified by a globally unique four-digit ADR number. A DOX project uses those records directly rather than keeping a parallel decision source. `dox lint` blocks broken ADR or contract references, stale symbols, uncovered configured paths, incomplete invariants, and parallel decision files.

## Common questions

**Does DOX replace every `AGENTS.md` file?**

No. It is the contract resolver for repositories that opt in with `dox.config.json`. Unconfigured repositories continue to use their existing `AGENTS.md` hierarchy. A configured project keeps canonical structured records and avoids a second, parallel decision ledger.

**Will installing or invoking the skill initialize my repository?**

No. Initialization is an explicit project mutation. Inspect `dox init` first and run `dox init --apply` only when you intend to create the project-local configuration and records.

**What should I do with a stale receipt?**

Resolve the task again against the current corpus. Expansion fails closed when the receipt no longer matches, so stale context is never silently treated as current.

## It's working if

- A compact DOX receipt appears before broad source inspection, including on read-only tasks.
- The agent makes one task-oriented resolution with known paths or changed files instead of enumerating records or sweeping synonyms.
- Optional detail is visibly deferred, while every returned binding invariant is complete.
- Full bodies are expanded only by discovered ID and only when the compact excerpt is insufficient.
- The resulting plan or answer accounts for the applicable owners, decisions, contracts, invariants, and dependencies, then uses targeted code reads to verify behavior.

## Where it fits

`dox` is a **reach-for-it-anytime standalone** that most often runs beneath another flow. Its closest neighbor is [domain-modeling](https://aihero.dev/skills-domain-modeling), because that skill supplies the semantic adjudication for terminology and durable decisions; [ask-matt](https://aihero.dev/skills-ask-matt) maps both layers into the larger engineering flows.
