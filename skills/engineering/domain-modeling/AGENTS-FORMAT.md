# AGENTS.md Domain Documentation Format

This is the domain-language storage reference for the `domain-modeling` skill. Domain language lives inline in the **Ubiquitous Language** section of the nearest owning `AGENTS.md`. Do not create a parallel glossary document.

## Read and write scope

Before editing, locate the work area and read its DOX chain from the repository root down to the nearest `AGENTS.md`. The chain is one inherited contract:

```text
/
├── AGENTS.md                       ← repository-wide language and decisions
├── apps/
│   └── billing/
│       └── AGENTS.md               ← billing-specific additions
└── packages/
    └── payments/
        └── AGENTS.md               ← payments-specific additions
```

Put a term at the narrowest scope that owns its meaning:

- Repository-wide terms belong in the root `AGENTS.md`.
- App- or package-wide terms belong in that app or package's `AGENTS.md`.
- Subtree-specific terms belong in the nearest durable child boundary.

A child inherits its parents. Define only the terms the child introduces or deliberately specializes; reference inherited language instead of restating it. If the same word means different things in two subtrees, surface the ambiguity and choose one canonical term or qualify each term so the distinction is explicit.

## Preferred AGENTS.md shape

When creating or substantially structuring an `AGENTS.md`, prefer this order while respecting any established local format:

1. **Purpose** — what this folder owns and why it exists.
2. **Ownership** — what belongs here versus in a parent or child scope.
3. **Change Protocol** — how readers should load and update the DOX chain.
4. **Local Contracts** — binding rules for this subtree.
5. **Ubiquitous Language** — canonical terms and aliases to avoid.
6. **Architectural Decisions** — inline, globally numbered ADR entries.
7. **Work Guidance** — patterns, conventions, stack, commands, and examples.
8. **Verification** — checks and tests relevant to this subtree.
9. **Child DOX Index** — direct child `AGENTS.md` documents.

Create sections only when they carry useful content. Follow an existing document's structure when it already expresses the same responsibilities clearly.

## Canonical term entries

Use a canonical name, a tight definition, and aliases to avoid:

```md
## Ubiquitous Language

**Order**:
A customer's request to purchase one or more items, tracked from placement to fulfillment.
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request
```

A compact table is also appropriate for a larger glossary or when the surrounding document already uses tables:

```md
| Term | Definition | Avoid |
|------|------------|-------|
| **Order** | A customer's request to purchase one or more items. | Purchase, transaction |
| **Invoice** | A request for payment sent after delivery. | Bill, payment request |
```

Group terms under subheadings when natural clusters emerge, such as a lifecycle, actor group, or subdomain. Keep a flat list when all terms belong to one cohesive area.

## Relationships, dialogue, and ambiguity

An explicit glossary-building pass should make important relationships and boundary conflicts visible, not merely list nouns.

Express relationships with canonical terms and include cardinality when it is known:

```md
### Relationships

- An **Invoice** belongs to exactly one **Customer**.
- An **Order** produces one or more **Invoices**.
```

Add a short example dialogue when it helps future readers use the language precisely. Use three to five exchanges between a developer and domain expert, and make the exchange clarify boundaries or lifecycle rather than repeat definitions:

```md
### Example dialogue

> **Dev:** "When a **Customer** places an **Order**, do we create the **Invoice** immediately?"
>
> **Domain expert:** "No. An **Invoice** is created only after a **Fulfillment** is confirmed."
>
> **Dev:** "Can one **Order** produce several **Invoices**?"
>
> **Domain expert:** "Yes, when its items are completed in separate **Fulfillments**."
```

Keep unresolved or historically important ambiguity explicit until it is settled:

```md
### Flagged ambiguities

- "account" has meant both **Customer** and **User**. Use **Customer** for the party that places orders and **User** for an authentication identity.
```

When the ambiguity is resolved, update the canonical entries and either remove the flag or retain a concise warning if the old usage still appears in code or conversation.

## Writing rules

- **Be opinionated.** Pick the best term for a concept and list competing synonyms under `_Avoid_`.
- **Keep definitions tight.** Use one or two sentences and define what the concept is, not how its implementation works.
- **Write for domain experts.** Include domain-relevant nouns, verbs, events, states, and relationships. Skip classes, modules, endpoints, and generic programming concepts unless they have domain meaning.
- **Flag conflicts explicitly.** Do not silently normalize an overloaded word or pretend an unresolved distinction is settled.
- **Show relationships.** Use canonical names and state cardinality or direction when known.
- **Keep the section cohesive.** Domain examples may clarify meaning; specifications, implementation decisions, and scratch notes do not belong in **Ubiquitous Language**.

## Change protocol and child indexes

For every domain-language change:

1. Read the applicable `AGENTS.md` chain root-to-nearest before editing.
2. Follow the nearest owning document's **Change Protocol**.
3. Write the smallest durable change at the scope that owns it.
4. Avoid duplicating inherited terms; cross-reference the parent when a reminder is useful.
5. If a new durable child boundary is required, create its `AGENTS.md` and add a relative link with a one-line scope description to the parent's **Child DOX Index**.

```md
## Child DOX Index

- [Billing](./apps/billing/AGENTS.md) — billing-specific contracts, language, and decisions.
```

When revisiting the glossary, merge new conversation evidence into the existing section, evolve definitions when understanding changes, flag new ambiguity, and refresh relationships or example dialogue that no longer reflect the model.
