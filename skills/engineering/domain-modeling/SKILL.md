---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when discussing codebase terminology or ubiquitous language, resolving ambiguous or overloaded terms, writing or editing a domain contract or architectural decision, or when another skill needs semantic adjudication for the project's contract.
---

# Domain modeling

Build the project's domain model while designing. Challenge terms, test edge cases, resolve ambiguity, and record settled language and durable decisions as they crystallise.

## Select one storage branch

Check for `dox.config.json` when choosing the contract store. Its presence selects one branch. Never read or write both stores.

### Configured DOX direct cutover

Follow the installed `/dox` skill for retrieval eligibility, context reuse, and maintenance. Adjudicate terminology and decisions against the delivered contract. Keep semantic updates in canonical records, not a parallel `AGENTS.md` or `DECISIONS.md` ledger.

`/domain-modeling` adjudicates meaning. `/dox` owns invocation, retrieval, reuse, and record-maintenance policy.

### Unconfigured AGENTS fallback

Use this branch only when `dox.config.json` is absent. Locate the work area, find its nearest `AGENTS.md`, and read each `AGENTS.md` from the repository root to that owner plus any relevant co-located `DECISIONS.md` entries the chain indexes. Parent language and decisions are inherited unless a child specializes them.

Write new knowledge at the narrowest owning scope. Create sections only when they have content and child `AGENTS.md` files only for durable local ownership. Follow the owner's `## Change Protocol` and keep its parent's `## Child DOX Index` current.

Read [AGENTS-FORMAT.md](./AGENTS-FORMAT.md) before adding or restructuring fallback domain language. Read [ADR-FORMAT.md](./ADR-FORMAT.md) before allocating or recording a fallback architectural decision.

## During the session

### Challenge the resolved language

Compare the user's words with the configured DOX items or the fallback `## Ubiquitous Language` chain. Call out conflicts immediately: "The domain model defines 'cancellation' as X, but you seem to mean Y. Which is it?"

If one scope gives an inherited term a different meaning, treat that as a modeling problem. Prefer one canonical term. If the concepts differ, qualify or rename them so the distinction is visible.

### Extract and sharpen the glossary

Scan for domain nouns, verbs, events, states, and relationships. Look for:

- one word used for different concepts;
- several words used for one concept;
- vague or overloaded terms;
- implicit relationships or lifecycle boundaries.

Propose one canonical term for each concept. Record aliases to avoid, flag unresolved ambiguity, and keep definitions short and domain-facing. Exclude programming terms and implementation names unless domain experts use them.

During an explicit glossary pass, capture relationships and known cardinality. Add a short developer/domain-expert dialogue when it clarifies boundaries. In configured DOX, follow the resolved record's schema and local shape. In the unconfigured fallback, use [AGENTS-FORMAT.md](./AGENTS-FORMAT.md) and merge with inherited material instead of duplicating it.

### Discuss concrete scenarios

Invent edge cases that force precision about ownership, boundaries, cardinality, lifecycle, and failure behavior.

### Cross-reference with code

Check stated behavior against code. Surface contradictions directly: "The code cancels entire Orders, but you said partial cancellation is possible. Which is intended?" Treat code as evidence, not automatic truth.

### Record settled semantics

Write each resolved canonical term and relationship when it settles. In configured DOX, follow the installed `/dox` skill's maintenance policy for settled meaning, including durable boundaries and behavioral contracts that do not need an ADR. In the unconfigured fallback, update the nearest owner's **Ubiquitous Language** section immediately.

Keep domain records focused on canonical language, definitions, relationships, useful dialogue, and flagged ambiguity. Put implementation guidance, specifications, and scratch notes elsewhere.

### Offer durable decisions sparingly

Offer a decision record only when all three are true:

1. **Hard to reverse**: changing it later is meaningfully costly.
2. **Surprising without context**: a future reader will ask why.
3. **A real trade-off**: alternatives existed and one was chosen for a reason.

If any condition is absent, skip the ADR, not other durable meaning. In configured DOX, follow the installed `/dox` skill's maintenance policy. In the unconfigured fallback, allocate the next global immutable number and use the nearest owner's **Architectural Decisions** section as described in [ADR-FORMAT.md](./ADR-FORMAT.md).
