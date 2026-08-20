Quickstart:

```bash
npx skills add mattpocock/skills --skill=dox
```

```bash
npx skills update dox
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/engineering/dox)

## What it does

`dox` is the **DOX-first** context seam for repositories that keep engineering contracts as structured records. Before an agent researches or changes the repository—even for a read-only question—it resolves the applicable ownership, decisions, contracts, binding invariants, and dependencies, then uses that receipt to guide targeted source inspection.

Its defining constraint is structural: `dox` retrieves and validates records, but it does not adjudicate what a term, relationship, or decision means. Use [domain-modeling](https://aihero.dev/skills-domain-modeling) for that semantic work.

## When to reach for it

Type `/dox`, or the agent reaches for it automatically whenever it works in a repository with `dox.config.json`.

In a configured repository, reach for it before research, planning, debugging, review, or implementation. The CLI is the retrieval interface: agents refine resolver cues and follow the receipt instead of enumerating the record directory. For resolving ambiguous terminology or deciding whether a trade-off deserves a durable decision, use [domain-modeling](https://aihero.dev/skills-domain-modeling) instead.

## Prerequisites

Resolution requires a project-local `dox.config.json` and its configured records. Project setup is always explicit: inspect `dox init`, then run `dox init --apply` only when you intend to initialize the current repository. Installing or invoking the skill never initializes a project automatically.

## The contract layer

`dox` is the automatic **contract-retrieval and structural-validation** layer underneath engineering flows. DOX-first keeps structured-record discovery inside the CLI, returns a receipt-backed context bundle, and directs the agent toward only the source paths and symbols needed to verify behavior.

Resolution also surfaces optional source path, heading, and digest metadata, so migrated records remain traceable to the exact frozen source section without reading a second runtime source.

Records use a versioned, closed schema. Each record has one owner and a Markdown body; unknown fields and incomplete binding records fail closed. Invariants capture enforcement targets, dependent consumers, verification, failure modes, impact, criticality, and lifecycle state. Proposed invariants are nonbinding until accepted or enforced.

Architectural decisions are full `decision` records identified by a globally unique four-digit ADR number. A DOX project uses those records directly rather than keeping a parallel decision source. `dox lint` blocks broken ADR or contract references, stale symbols, uncovered configured paths, incomplete invariants, and parallel decision files.

## It's working if

- A DOX receipt appears before broad source inspection, including on read-only tasks.
- The agent refines `dox resolve` or `dox search` instead of enumerating the record directory; an empty search switches to source-path discovery rather than a synonym sweep.
- The resulting plan or answer accounts for every returned critical record and uses targeted code reads to verify behavior.

## Where it fits

`dox` is a **reach-for-it-anytime standalone** that most often runs beneath another flow. Its closest neighbor is [domain-modeling](https://aihero.dev/skills-domain-modeling), because that skill supplies the semantic adjudication for terminology and durable decisions; [ask-matt](https://aihero.dev/skills-ask-matt) maps both layers into the larger engineering flows.
