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

`paths`, `intents`, `symbols`, `terms`, and `aliases` are deterministic matching evidence for the natural-language task and any supplied paths. `adr` is valid only on a `kind: decision` record, and every `adr_refs` value must resolve to a decision ADR.

Declare a contract with the `id` or an `aliases` value of a `kind: contract` record, with `contracts` or `contract`, or with a `terms` value prefixed by `contract:`. A contract name belongs to one record. Repeating an equivalent declaration within that record is valid, but declaring the same name in another record fails strict loading and lint. Every contract named by `contract_refs`, `depends_on.contract`, `enforced_by.contract`, or `depended_on_by.contract` must resolve to one of these declarations. An ordinary record ID is not a contract declaration.

An `owner` value that contains `/` identifies an accountable repository scope. Its scope root and descendants are path evidence in addition to explicit `paths`. Use an explicit path such as `src/**` for a top-level scope because a single-segment owner remains a team or domain name.

Supported record kinds are `record`, `decision`, `contract`, `invariant`, `ownership`, and `term`. Every record requires one `owner` and a non-empty body. Store each full architectural decision as a `decision` record with its globally unique `adr`. A DOX project must not retain a parallel `DECISIONS.md` file or actual ADR entries under an `Architectural Decisions` section in an index-tracked `AGENTS.md`. Explicit pointers to DOX records are allowed. ADR-shaped examples inside HTML comments and fenced code are ignored.

Invariant enforcement is explicit: `enforcement` classifies the mechanisms (`database`, `type`, `chokepoint`, `test`, `lint`, or `prose`) while `enforced_by` identifies where the guarantee can be weakened. A binding may name a path, symbol, intent, or declared contract. Invariants require a statement, state, impact, criticality, failure modes, and dependency targets. `accepted` and `enforced` invariants also require enforcement classifications, enforcement targets, and verification. Supported states are `proposed`, `accepted`, `enforced`, and `retired`; proposals remain nonbinding. An enforcement match returns the complete invariant tuple. `depends_on` identifies what a record relies on. `depended_on_by` identifies consumers whose behavior relies on the guarantee; a consumer match returns the same tuple with dependent relationship evidence. Mention a declared contract in the resolver task or supply an applicable path to retrieve its relations. Undeclared contracts fail closed in strict loading and produce the same field-specific errors during lint.

`source_path`, `source_heading`, `source_sha256`, and `source_digest` are optional provenance metadata. Compact resolution returns them with the record capsule. The capsule also contains a bounded task-relevant excerpt and a `body_ref` digest. Retrieve a full body only with `dox resolve --from <receipt-id> --expand <record-id>`.

Normal resolution is budgeted atomically. Optional capsules can be listed in `receipt.deferred`, but accepted and enforced invariant tuples are never truncated. A budget that cannot hold mandatory context returns `DOX_BUDGET_TOO_SMALL`.


All path values are relative to the Git root. `*` and `**` are supported. Absolute paths, parent traversal, and character-class patterns are rejected.
