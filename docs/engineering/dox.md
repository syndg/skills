## What it does

`dox` loads a repository's intended meaning and binding obligations from canonical records. Its curated brief delivers full standing context in a deliberate order, plus the invariants that apply to the work's paths. The brief is assembled deterministically from those records, not written as an LLM summary or maintained as a second ledger.

Source and runtime still own current facts. DOX describes what the system is meant to mean and preserve. When those disagree, the agent reports the discrepancy instead of quietly treating either as the other.

## When to reach for it

Type `/dox`, or the agent reaches for it automatically when a task fits in a repository with `dox.config.json`.

| Task | What happens |
| --- | --- |
| Substantive design, behavioral change, or review of that work | Load the applicable curated brief before making design choices; review the actual changed paths afterwards. |
| Intended meaning, domain boundaries, or governing decisions | Load the scope's standing meaning; retrieve additional named context or decision rationale only when needed. |
| File locations, current code behavior, scripts, configuration, Git state, external tools, or runtime checks | Read or run the source that owns the fact. DOX is not a preliminary step. |
| Questions about DOX invocation, reuse, or maintenance procedure | Answer from the loaded skill. Retrieve repository context only when repository-specific facts or an actual record change are needed; a hypothetical example does not require an implementation audit. |
| Follow-up in the same task and scope | Reuse loaded context. Crossing a material boundary or changing records may require fresh context. |
| New durable meaning settled during the work | Update the canonical record and its applicability or scope membership where needed. |

Use [domain-modeling](https://aihero.dev/skills-domain-modeling) when the meaning itself needs debate, rather than retrieval.

## Prerequisites

The target repository needs `dox.config.json`, canonical records, and curated scope membership. Initialization is explicit and requires approval of its preview before any files are written. Installing the skill does not initialize a repository or invent its contracts.

Unconfigured repositories retain their root-to-nearest `AGENTS.md` fallback and indexed co-located `DECISIONS.md` entries. Configured repositories do not keep that as a second contract store.

## Three kinds of context

| Context | Why it is separate |
| --- | --- |
| Standing scope meaning | Definitions, boundaries, and contracts you need to understand the area, delivered as full record bodies in curated order. |
| Path-specific binding obligations | Complete invariant tuples, including enforcement, dependencies, verification, and failure modes. Accountability alone does not make an invariant apply to an owner's whole subtree. |
| Decision rationale | An intelligible ADR title/index makes decisions discoverable without loading every historical argument. Full rationale is available through receipt-backed expansion. |

A scope lists record IDs rather than copied prose. Matching scopes inherit root-to-nearest and deduplicate membership. The same canonical record can therefore serve several scopes without acquiring several drifting summaries.

## Retrieval without task-prompt search

`dox brief --path src/auth/login.ts` selects standing meaning and applicable bindings without needing a natural-language task. Source discovery can happen first to find the right path. `dox resolve` adds a named domain, term, contract, or decision; receipt expansion loads a discovered full body when the answer needs it.

The default output is readable wrapped text. `--json` provides the structured form. Both are budgeted atomically: required standing bodies and bindings are not silently cut to fit. A missing scope is an explicit curation gap, not a fallback search. A budget failure reports the bytes needed for complete delivery.

The default ceilings are 128 KiB for briefs, 16 KiB for named retrieval, and 64 KiB for expansion. A brief does not fill spare budget with supplementary path-matched records.

The installed skill owns invocation, reuse, and maintenance policy. Other skills and project pointers route to it rather than carrying their own copy of the procedure.

## Common questions

**Does DOX need to run before I start a local server or inspect a script?**

No. Startup commands and current runtime behavior come from scripts, configuration, and the running program. If that work becomes a behavioral change or raises a question about intended policy, DOX applies at that boundary.

**Why did it load a brief again during review?**

Standing meaning can be reused, but the finished work may touch enforcement or dependent paths that were not known earlier. The review checks those actual paths. Unrelated worktree edits and incidental branch history should not enter a path-limited review.

**Does `binding_complete` mean nothing important was missed?**

No. It means the selected applicable binding set was delivered under the recorded evidence. Missing paths, scope membership, or dependency edges can still hide a real obligation. Source evidence that exposes such a gap belongs in the maintenance review.

**What if the code and the record disagree?**

The agent should name both the observed behavior and the intended contract. Correcting stale facts is different from changing policy. New policy needs a settled decision, not an inference that current code must be right.

**Must every durable statement become an ADR?**

No. Standing domain meaning and binding obligations have their own records. ADRs preserve rationale for hard-to-reverse, surprising choices with real trade-offs. Routine implementation facts stay in their source rather than becoming a second catalog in DOX.

**Can a receipt travel in a handoff?**

It can identify a local retrieval, but it is not loaded prose or portable authority. A recipient follows the installed skill's grounding policy in its own worktree. Supplied excerpts are hints, and an agent without repository access must say so.

## It's working if

- The agent reads full standing meaning before proposing a substantive design, without guessing search terms from your prompt.
- A source lookup or runtime command proceeds directly, and ordinary follow-ups do not reload the same context.
- The work respects each applicable invariant's failure modes and verification, not just its statement.
- A path-limited review does not pull in unrelated branch changes.
- A newly settled boundary or contract becomes durable even when no old record was wrong.
- Missing curation and code-versus-contract contradictions are reported rather than hidden by successful retrieval.

## Where it fits

`dox` is the model-invoked contract layer beneath repository engineering flows. [domain-modeling](https://aihero.dev/skills-domain-modeling) adjudicates the meaning that DOX retrieves and maintains. [ask-matt](https://aihero.dev/skills-ask-matt) maps those roles into the wider skill set.
