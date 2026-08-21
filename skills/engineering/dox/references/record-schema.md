# DOX record schema

Each record is a Markdown file with YAML frontmatter.

`dox.config.json` must declare `"schema_version": 1`. Unsupported versions and unknown config or record fields fail closed.

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
adr: ADR-0014
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

`paths`, `intents`, `symbols`, `terms`, and `aliases` are deterministic matching evidence for the natural-language task and any supplied paths. `adr` identifies the record's ADR. `adr_refs` and `contract_refs` must resolve during lint. Declare contract names with `contracts`, or use a `terms` value prefixed with `contract:`. An `owner` value that contains `/` identifies an accountable repository scope; its scope root and descendants are path evidence in addition to explicit `paths`. Use an explicit path such as `src/**` for a top-level scope because a single-segment owner remains a team or domain name.

Supported record kinds are `record`, `decision`, `contract`, `invariant`, `ownership`, and `term`. Every record requires one `owner` and a non-empty body. Store each full architectural decision as a `decision` record with its globally unique `adr`; `adr_refs` only point to those records. A DOX project must not retain a parallel `DECISIONS.md` source.

Invariant enforcement is explicit: `enforcement` classifies the mechanisms (`database`, `type`, `chokepoint`, `test`, `lint`, or `prose`) while `enforced_by` identifies where the guarantee can be weakened. Invariants require a statement, state, impact, criticality, failure modes, and dependency targets. `accepted` and `enforced` invariants also require enforcement classifications, enforcement targets, and verification. Supported states are `proposed`, `accepted`, `enforced`, and `retired`; proposals remain nonbinding. An enforcement-path match returns the complete invariant tuple. `depended_on_by` identifies consumers whose behavior relies on the guarantee; a consumer match returns the same tuple with dependent relationship evidence. A dependency may name a declared `contract`; mention that contract in the resolver task or supply an applicable path. Undeclared contract dependencies fail closed.

`source_path`, `source_heading`, `source_sha256`, and `source_digest` are optional provenance metadata. Compact resolution returns them with the record capsule. The capsule also contains a bounded task-relevant excerpt and a `body_ref` digest. Retrieve a full body only with `dox resolve --from <receipt-id> --expand <record-id>`.

Normal resolution is budgeted atomically. Optional capsules can be listed in `receipt.deferred`, but accepted and enforced invariant tuples are never truncated. A budget that cannot hold mandatory context returns `DOX_BUDGET_TOO_SMALL`.


All path values are relative to the Git root. `*` and `**` are supported. Absolute paths, parent traversal, and character-class patterns are rejected.
