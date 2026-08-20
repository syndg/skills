# DOX record schema

Each record is a Markdown file with YAML frontmatter.

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
adr: ADR-014
adr_refs: [ADR-002]
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

`paths`, `intents`, `symbols`, `terms`, and `aliases` are matching cues. `adr` identifies the record's ADR. `adr_refs` and `contract_refs` must resolve during lint. Declare contract names with `contracts`, or use a `terms` value prefixed with `contract:`.

Invariant enforcement is explicit: `enforcement` classifies the mechanisms (`database`, `type`, `chokepoint`, `test`, `lint`, or `prose`) while `enforced_by` identifies where the guarantee can be weakened. An enforcement-path match returns the full invariant. `depended_on_by` identifies consumers whose behavior relies on the guarantee; a consumer match returns a useful impact summary and dependency receipt.

`source_path`, `source_heading`, `source_sha256`, and `source_digest` are optional provenance metadata. Resolution returns them with the record so callers can trace migrated knowledge to the frozen source and section digest.

All path values are relative to the Git root. `*` and `**` are supported. Absolute paths, parent traversal, and character-class patterns are rejected.
