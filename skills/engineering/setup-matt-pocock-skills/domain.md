# Domain docs

Before repository exploration, check for `dox.config.json`. Its presence selects exactly one branch below. Never combine the branches.

## Configured DOX branch

Use this branch when `dox.config.json` is present. Root `AGENTS.md` carries the minimal activation pointer to the installed `dox` skill.

The installed `dox` skill owns when and how resolution, expansion, change-impact review, and lint run. This file does not repeat that procedure. Configured records remain canonical; do not enumerate the record directory, fall back to an AGENTS domain hierarchy, mirror records into instruction files, or keep a parallel `DECISIONS.md`.

DOX initialization is separate setup. Preview `dox init`, then run `dox init --apply` only after explicit human approval.

## Unconfigured AGENTS fallback

Use this branch only when `dox.config.json` is absent.

1. Locate the code, plan, or domain area about to change.
2. Find the nearest `AGENTS.md` at or above that area.
3. Read each `AGENTS.md` from the repository root to that nearest document. Parent contracts, `## Ubiquitous Language`, and `## Architectural Decisions` are inherited unless a child specializes them.
4. Follow the nearest owner's `## Change Protocol`.

Proceed when the domain sections are absent. `/domain-modeling` creates them lazily after terms or decisions settle.

A root-only repository uses one fallback document:

```text
/
├── AGENTS.md
└── src/
```

Add a child `AGENTS.md` only for a durable local ownership boundary. List each direct child in the parent's `## Child DOX Index`. Put new knowledge in the nearest owner. Architectural decisions use global, immutable `ADR-NNNN` numbers, with co-located `DECISIONS.md` available only when the inline section outgrows the hot path.

Use canonical terms from the applicable `## Ubiquitous Language` sections. If a needed concept is missing, reconsider the wording or take the gap to `/domain-modeling`.

If work conflicts with an inherited decision, cite it instead of silently overriding it:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because..._
