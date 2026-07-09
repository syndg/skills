# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- Locate the code, plan, or domain area you're about to work in.
- Find the nearest **`AGENTS.md`** at or above that area.
- Read every **`AGENTS.md`** from the repo root down to that nearest document. Parent contracts, `## Ubiquitous Language`, and `## Architectural Decisions` are inherited unless a child explicitly specializes them.
- Follow the nearest owning document's **`## Change Protocol`**.

If the applicable domain sections don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates sections and child documents lazily when terms or decisions actually get resolved.

## DOX hierarchy

Root-only repo (most repos):

```
/
├── AGENTS.md                       ← repository-wide language and decisions
└── src/
```

Repo with durable local boundaries:

```
/
├── AGENTS.md                       ← repository-wide language and decisions
├── apps/
│   └── billing/
│       └── AGENTS.md               ← billing-specific additions
└── packages/
    └── payments/
        └── AGENTS.md               ← payments-specific additions
```

Each parent lists its direct child documents in `## Child DOX Index`. Put new knowledge in the nearest `AGENTS.md` that owns it; create a child only for a durable subtree-specific contract and update the parent's index at the same time. Architectural decisions use global, immutable `ADR-NNNN` numbers across the entire hierarchy.

## Use the Ubiquitous Language

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the `## Ubiquitous Language` sections of the applicable `AGENTS.md` chain. Don't drift to synonyms those sections explicitly avoid.

If the concept you need isn't in the applicable chain yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
