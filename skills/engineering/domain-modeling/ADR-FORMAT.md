# AGENTS.md Architectural Decision Format

This is the architectural-decision storage reference for the `domain-modeling` skill. Decisions live inline in the **Architectural Decisions** section of the nearest owning `AGENTS.md` while that section is small; a section that has grown to dominate the file graduates to a co-located `DECISIONS.md` (see "When the section outgrows the hot path"). Never create a file per decision or a central `docs/adr/` directory.

## Entry shape

Match the surrounding document's style. Most decisions should use a heading plus a tight Decision/Consequences pair:

```md
### ADR-0019 — {Short title of the decision}

- **Decision:** {What was decided and why, in one or two sentences.}
- **Consequences:** {Only the non-obvious downstream effects worth preserving.}
```

A thinner document may use a single bullet:

```md
- **ADR-0019 — {Short title}:** {What was decided and why, in one to three sentences.}
```

The value is in recording that a decision was made and why, not in filling out a template. Add **Consequences** only when they are non-obvious. Add considered alternatives only when remembering their rejection will prevent the same trade-off from being reopened without new evidence.

## Global, immutable numbering

`ADR-NNNN` numbers are global across the repository and immutable. They are stable cross-reference anchors, not a per-document sequence.

Before adding a decision, scan `ADR-` labels across the entire `AGENTS.md` tree, find the highest number, and allocate the next one. For example:

```sh
rg -o --glob 'AGENTS.md' 'ADR-[0-9]{4}' .
```

- Do not fill gaps or reuse numbers from removed decisions.
- Expect numbers to be non-contiguous within any one `AGENTS.md`; each document contains only the decisions governing its subtree.
- Never renumber or re-slug an existing ADR.
- When a decision is superseded, retain its entry and note the replacement, such as `Superseded by ADR-0024`.
- Cross-reference inherited decisions by number rather than copying their text into child documents.

## Placement and change protocol

Put the decision in the narrowest `AGENTS.md` whose subtree it governs:

- Repository-wide decisions go in the root document.
- App- or package-wide decisions go in that app or package's document.
- Subtree-specific decisions go in the relevant child document.

Before writing, read every `AGENTS.md` from the repository root to the target scope and check for inherited decisions that already settle or constrain the choice. Follow the owning document's **Change Protocol**. If the correct scope requires a new child document, create it lazily and keep the parent's **Child DOX Index** current.

## When the section outgrows the hot path

The `AGENTS.md` chain is read on every edit; ADR bodies are cold content — immutable, append-only, needed only when touching or reversing that specific decision, or recording a new one. Keep bodies inline while the section is small. When they start dominating the always-read file (rule of thumb: around a quarter of the file, or roughly fifteen decisions at one node), split:

1. **Promote constraints first.** Any rule inside a body that must be honored on *every* edit moves into the document's **Local Contracts** section with a `Rationale: ADR-NNNN` pointer. The binding surface must stay always-read; only rationale and history may go cold.
2. **Move the bodies verbatim** into a `DECISIONS.md` co-located next to that `AGENTS.md`.
3. **Leave a one-line index** in the **Architectural Decisions** section — one entry per decision, immutable number kept, linking to `DECISIONS.md`. The index is the discovery surface, not the binding contract.
4. **Document the two-file procedure** in the index preamble: allocate the next global number, write the body in `DECISIONS.md`, add the index line.

Every decision keeps its index line in `AGENTS.md`, so number scans over `AGENTS.md` remain complete after the split. `DECISIONS.md` is co-located cold storage — this is not a return to a central `docs/adr/` directory, and all numbering, immutability, and placement rules in this document apply to it unchanged.

## When to record an ADR

All three conditions must be true:

1. **Hard to reverse** — changing the decision later carries meaningful cost.
2. **Surprising without context** — a future reader will wonder why the system works this way.
3. **The result of a real trade-off** — genuine alternatives existed and one was chosen for specific reasons.

If a decision is easy to reverse, skip it. If it is unsurprising, future readers will not need an explanation. If there was no real alternative, there is no trade-off to preserve.

### What qualifies

- **Architectural shape.** "The write model is event-sourced, while the read model is projected into Postgres."
- **Ownership and boundary decisions.** "Customer data is owned by the Customer scope; other scopes reference it by ID only." Explicit exclusions are as valuable as inclusions.
- **Integration patterns between scopes.** "Ordering and Billing communicate through domain events rather than synchronous HTTP."
- **Technology choices that carry lock-in.** Record databases, message buses, auth providers, and deployment targets when replacement would be costly; do not record every library choice.
- **Deliberate deviations from the obvious path.** "We use manual SQL instead of an ORM because X." These records stop a later engineer from undoing an intentional constraint.
- **Constraints not visible in code.** "Response times must stay below 200 ms because of the partner API contract."
- **Rejected alternatives with non-obvious reasoning.** Preserve why an attractive option was rejected when the same proposal is likely to recur.
