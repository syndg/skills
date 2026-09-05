Skills are organized into bucket folders under `skills/`:

- `engineering/` — daily code work
- `productivity/` — daily non-code workflow tools
- `misc/` — kept around but rarely used, not promoted
- `personal/` — tied to my own setup, not promoted
- `in-progress/` — drafts not yet ready to ship
- `deprecated/` — no longer used

Every skill in `engineering/` or `productivity/` (the **promoted** buckets) must have a reference in the top-level `README.md`. Skills in `misc/`, `personal/`, `in-progress/`, and `deprecated/` must not appear there.

Each skill entry in the top-level `README.md` must link the skill name to its `SKILL.md`.

Each bucket folder has a `README.md` that lists every skill in the bucket with a one-line description, with the skill name linked to its `SKILL.md`. The promoted buckets' `README.md`s and the top-level `README.md` group entries into **User-invoked** and **Model-invoked**; non-promoted bucket `README.md`s (`misc/`, `personal/`) use a flat list.

Skills in `engineering/` and `productivity/` also have a human-facing docs page at `docs/<bucket>/<skill-name>.md` (the docs tree mirrors those two bucket folders under `skills/`). The published URL is `https://aihero.dev/skills-<skill-name>` regardless of bucket — the docs path is repo organisation only. When you add, rename, or change the behaviour of a skill in `engineering/` or `productivity/`, create or re-sync its docs page following [.agents/writing-docs.md](./.agents/writing-docs.md). Skills in the non-promoted buckets (`misc/`, `personal/`, `in-progress/`, `deprecated/`) get **no** docs page.

Every `SKILL.md` is either user-invoked (`disable-model-invocation: true` plus `policy.allow_implicit_invocation: false` in `agents/openai.yaml`, reachable only by the human) or model-invoked (model- or user-reachable). See [.agents/invocation.md](./.agents/invocation.md).

[`ask-matt`](./skills/engineering/ask-matt/SKILL.md) is the router that maps every user-reachable skill and how they relate. The same trigger that re-syncs a docs page applies to it: whenever you add, rename, remove, or change how a user-reachable skill fits the flows, re-read `ask-matt`'s `SKILL.md` and update it so the map stays accurate — a new skill it never mentions, or a stale one it still routes to, is a router that lies.

Repository-aware skills must preserve the DOX direct-cutover contract. A configured project (`dox.config.json` present) follows the installed `dox` skill for retrieval eligibility, context reuse, and maintenance, including delegated worktree grounding. Keep that procedure in the skill, not in callers or generated pointers. Only an unconfigured project falls back to its applicable root-to-nearest `AGENTS.md` chain and indexed co-located `DECISIONS.md` entries. Reserve `CLAUDE.md` for harness-operational instructions and pointers, not fallback domain-contract storage. Configured projects keep canonical records, not a parallel `AGENTS.md` / `DECISIONS.md` ledger.

To (re)link every skill into the local harness skill directories (`~/.claude/skills`, `~/.agents/skills`, `~/.codex/skills`), run `scripts/link-skills-syndg.sh`. Each entry is a symlink into this repo, so a `git pull` keeps installed skills current; re-run the script after adding, removing, or renaming a skill.

## Ubiquitous Language

**Issue tracker**:
The tool that hosts a repository's issues, such as GitHub Issues, Linear, or a local `.scratch/` Markdown convention. Skills such as `to-tickets`, `to-spec`, and `triage` read from and write to it.
_Avoid_: backlog manager, backlog backend, issue host

**Issue**:
A single tracked unit of work inside an **Issue tracker**, such as a bug, task, spec, or slice produced by `to-tickets`.
_Avoid_: ticket, except when quoting an external system or referring to a **Decision ticket**

**Decision ticket**:
A `wayfinder` child **Issue** that holds a question whose resolution is a decision, not a build slice to execute. `wayfinder` introduces the qualified term before using the shorter "ticket."

**Triage role**:
A canonical state-machine label applied to an **Issue** during triage, such as `needs-triage` or `ready-for-afk`. Each role maps to a label string in the **Issue tracker** through `docs/agents/triage-labels.md`.

### Relationships

- An **Issue tracker** holds many **Issues**.
- An **Issue** carries one **Triage role** at a time.
- A **Decision ticket** is an **Issue** and a child of a `wayfinder:map`.

### Flagged ambiguities

- "Backlog" previously meant both the tool hosting issues and the body of work inside it. Use **Issue tracker** for the tool; "backlog" is not a domain term.
- "Backlog backend" and "backlog manager" are former aliases for **Issue tracker**.

## Architectural Decisions

### ADR-0001 — Explicit `/setup-matt-pocock-skills` pointer only for hard dependencies

Engineering skills depend on per-repository configuration such as issue-tracker and triage-label vocabulary, plus the repository's selected contract route. An existing `dox.config.json` selects canonical DOX retrieval; its absence selects the `AGENTS.md` / `DECISIONS.md` fallback. `/setup-matt-pocock-skills` may configure consumer pointers and the unconfigured fallback, but it never initializes DOX without the human separately reviewing `dox init` and explicitly approving `dox init --apply`. Some skills cannot meaningfully function without their operational mapping: they have to publish to a specific issue tracker or apply a specific label string. Others use contract context to sharpen output and otherwise degrade gracefully.

We split these into **hard-dependency** and **soft-dependency** skills:

- **Hard dependency** (`to-tickets`, `to-spec`, `triage`): include an explicit one-liner telling the human to run `/setup-matt-pocock-skills` when the mapping is absent. A skill cannot invoke this user-only setup command itself. Without the mapping, output is wrong, not just fuzzy.
- **Soft dependency** (`diagnosing-bugs`, `tdd`, `improve-codebase-architecture`): follow the installed `dox` skill's eligibility and reuse policy when configured; use the applicable root-to-nearest `AGENTS.md` chain and indexed co-located `DECISIONS.md` entries only in the unconfigured fallback, and otherwise degrade gracefully when no project contract exists. Configured retrieval or lint failures remain blockers; they never trigger an AGENTS fallback.

The split keeps soft-dependency skills token-light and avoids cargo-culting the setup pointer into places where it isn't load-bearing.
