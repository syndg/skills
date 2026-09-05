# DOX record schema

Each record is a Markdown file with YAML frontmatter.

`dox.config.json` must declare `"schema_version": 1`. Unsupported versions and unknown config or record fields fail closed.

## Curated scopes

The optional `scopes` array selects standing meaning and decision indexes without duplicating record bodies:

```json
{
  "schema_version": 1,
  "records_dir": "dox/records",
  "scopes": [
    {
      "path": ".",
      "context": ["domain-language"],
      "decisions": ["ADR-0002"]
    },
    {
      "path": "src/payments",
      "context": ["payments-contract"],
      "decisions": []
    }
  ]
}
```

Each scope requires `path`, `context`, and `decisions`. Scope paths are canonical repository-relative directories, with `.` reserved for the root scope. They allow neither globs nor traversal. Scope paths must be unique. Context entries are ordered record IDs; decision entries are explicit `ADR-NNNN` IDs that resolve to decision records. Unknown references and duplicate entries within a scope list are errors.

`dox brief --path <path>` inherits matching scopes root-to-nearest, preserves curated membership order, and deduplicates inherited records. Context membership delivers each selected standing body in full. Decision membership delivers an ADR title/index, not the full rationale. Full decision bodies use receipt expansion. No matching scope is an explicit failure, never lexical fallback.

Curate shared meaning at the narrowest scope that needs it. Keep path-specific obligations in invariant bindings and optional rationale in decision records. Membership is an index over canonical records, not a second summary or instruction ledger.

## Records

```md
---
id: payment-authorization
kind: invariant
owner: payments
statement: Payment authorization has one guarded writer.
paths: [src/payments/**]
intents: [charge]
symbols: [authorizeCharge]
terms: [authorization]
aliases: [authz]
adr_refs: [ADR-0002]
contract_refs: [payments-api]
enforcement: [chokepoint, test]
enforced_by:
  - path: src/payments/authorize.ts
    symbol: authorizeCharge
depended_on_by:
  - path: src/orders/**
    contract: payments-api
verification: [bun test]
failure_modes: [unverified-charge]
impact: system-wide
criticality: high
state: enforced
source_path: docs/contracts/payments.md
source_heading: Authorization
source_sha256: <source-file-sha256>
source_digest: <section-sha256>
---

Explain the decision, contract, or invariant in Markdown.
```

`paths` supplies explicit applicability. `intents`, `symbols`, `terms`, and `aliases` provide named retrieval evidence; `resolve <subject>` is additional domain or decision retrieval, not a request to summarize a whole user task. `adr` is valid only on a `kind: decision` record, and every `adr_refs` value must resolve to a decision ADR.

Declare a contract with the `id` or an `aliases` value of a `kind: contract` record, with `contracts` or `contract`, or with a `terms` value prefixed by `contract:`. A contract name belongs to one record. Repeating an equivalent declaration within that record is valid, but declaring the same name in another record fails strict loading and lint. Every contract named by `contract_refs`, `depends_on.contract`, `enforced_by.contract`, or `depended_on_by.contract` must resolve to one of these declarations. An ordinary record ID is not a contract declaration.

`owner` identifies one accountable team, domain, or repository scope. Accountability is separate from applicability: an owner value, including one containing `/`, does not activate ordinary records or invariants for its subtree. Use explicit `paths`, `enforced_by`, `depended_on_by`, curated scope membership, and declared graph relations to express where context applies.

Supported record kinds are `record`, `decision`, `contract`, `invariant`, `ownership`, and `term`. Every record requires one `owner` and a non-empty body. Store each full architectural decision as a `decision` record with its globally unique `adr`. A DOX project must not retain a parallel `DECISIONS.md` file or actual ADR entries under an `Architectural Decisions` section in an index-tracked `AGENTS.md`. Explicit pointers to DOX records are allowed. ADR-shaped examples inside HTML comments and fenced code are ignored.

Invariant enforcement is explicit: `enforcement` classifies the mechanisms (`database`, `type`, `chokepoint`, `test`, `lint`, or `prose`) while `enforced_by` identifies where the guarantee can be weakened. A binding may name a path, symbol, intent, or declared contract. Invariants require a statement, state, impact, criticality, failure modes, and dependency targets. `accepted` and `enforced` invariants also require enforcement classifications, enforcement targets, and verification. Supported states are `proposed`, `accepted`, `enforced`, and `retired`; proposals remain nonbinding. An enforcement match returns the complete invariant tuple. `depends_on` identifies what a record relies on. `depended_on_by` identifies consumers whose behavior relies on the guarantee; a consumer match returns the same tuple with dependent relationship evidence. Name a declared contract in `resolve` or supply an applicable path to retrieve its relations. Undeclared contracts fail closed in strict loading and produce the same field-specific errors during lint.

`source_path`, `source_heading`, `source_sha256`, and `source_digest` are optional provenance metadata. Named resolution returns them with a record capsule and its `body_ref` digest. Briefs deliver selected standing bodies in full; additional full bodies, including ADR rationale, use `dox resolve --from <receipt-id> --expand <record-id>`.

Text is the default output; `--json` opts into the structured envelope. Both forms are budgeted atomically. Brief standing bodies and applicable accepted or enforced invariant tuples are never truncated. Optional details may be deferred with discoverable titles. A budget that cannot hold required context returns `DOX_BUDGET_TOO_SMALL` and the required byte count. `binding_complete` describes the selected binding set under recorded evidence, not a guarantee that the corpus captured every real obligation.


Record path patterns are relative to the Git root and support `*` and `**`. Absolute paths, parent traversal, and character-class patterns are rejected. Scope paths use the stricter directory rules above, not record globs.
