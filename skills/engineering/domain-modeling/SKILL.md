---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, resolve ambiguous or overloaded terms, record an architectural decision, or when another skill needs to maintain the domain model in the project's AGENTS.md hierarchy.
---

# Domain Modeling

Actively build and sharpen the project's domain model as you design. This is the active discipline: challenge terms, invent edge-case scenarios, resolve ambiguity, and write the resulting language and decisions down as soon as they crystallise. Merely reading the existing domain model is a normal codebase habit; use this skill when the model itself may change.

## Storage contract: AGENTS/DOX

`AGENTS.md` is the durable domain contract. Domain language lives inline in its **Ubiquitous Language** section, and architectural decisions live inline in its **Architectural Decisions** section.

The applicable contract is hierarchical. Before proposing or recording a change:

1. Locate the code, plan, or domain area under discussion.
2. Find the nearest `AGENTS.md` at or above that area.
3. Read every `AGENTS.md` from the repository root down to that nearest document. Parent language and decisions are inherited unless a child explicitly specializes them.
4. Choose the nearest owning `AGENTS.md` for the new knowledge: root for repository-wide knowledge, app or package level for that scope, and a child document for a durable subtree-specific boundary.

Create sections lazily, only when there is something worth recording. Create a child `AGENTS.md` only when its subtree needs a durable local contract. Follow the owning document's **Change Protocol** on every edit; when adding a child document, also add it to the parent's **Child DOX Index**.

Read [AGENTS-FORMAT.md](./AGENTS-FORMAT.md) before adding or restructuring domain language. Read [ADR-FORMAT.md](./ADR-FORMAT.md) before allocating or recording an architectural decision.

## During the session

### Challenge against the inherited language

Compare the user's terms with the **Ubiquitous Language** in the entire applicable `AGENTS.md` chain. Call out conflicts immediately: "The domain model defines 'cancellation' as X, but you seem to mean Y. Which is it?"

If a child appears to give an inherited term a different meaning, treat that as a modeling problem. Prefer one canonical term; if the concepts really differ, qualify or rename them so the distinction is visible.

### Extract and sharpen the glossary

Scan the conversation for domain-relevant nouns, verbs, events, states, and relationships. Look specifically for:

- one word used for different concepts;
- several words used for the same concept;
- vague or overloaded terms;
- relationships or lifecycle boundaries that remain implicit.

Propose an opinionated canonical term for each concept: "You're saying 'account' — do you mean the Customer or the User? Those are different things." Record aliases to avoid, flag unresolved ambiguity explicitly, and keep definitions short and domain-facing. Exclude generic programming terms and implementation names unless domain experts genuinely use them.

When conducting an explicit glossary-building pass, capture the relationships between terms and state cardinality when it is known. Include a short example dialogue between a developer and domain expert that uses the canonical terms naturally and clarifies their boundaries. Use the structures in [AGENTS-FORMAT.md](./AGENTS-FORMAT.md); merge with existing material instead of duplicating inherited definitions.

### Discuss concrete scenarios

Stress-test domain relationships with specific scenarios. Invent edge cases that force precision about ownership, boundaries, cardinality, lifecycle, and failure behavior.

### Cross-reference with code

When the user states how something works, check whether the code agrees. Surface contradictions directly: "The code cancels entire Orders, but you just said partial cancellation is possible. Which is the intended model?"

Treat code as evidence, not automatic truth. Resolve whether the code, the documentation, or the user's current explanation needs to change.

### Update AGENTS.md inline

When language is resolved, update the **Ubiquitous Language** section of the nearest owning `AGENTS.md` immediately. Do not batch settled terms until the end of the session.

Keep that section focused on the domain model: canonical language, definitions, relationships, useful domain dialogue, and explicitly flagged ambiguity. Put implementation guidance, specifications, and scratch notes in the appropriate parts of the DOX contract or elsewhere, not in the glossary.

### Offer ADRs sparingly

Only offer to add an architectural decision when all three are true:

1. **Hard to reverse** — the cost of changing the decision later is meaningful.
2. **Surprising without context** — a future reader will wonder why the system works this way.
3. **The result of a real trade-off** — genuine alternatives existed and one was chosen for specific reasons.

If any condition is missing, skip the ADR. When all three apply, allocate the next global immutable number and add the entry to the **Architectural Decisions** section of the nearest owning `AGENTS.md` using [ADR-FORMAT.md](./ADR-FORMAT.md).
