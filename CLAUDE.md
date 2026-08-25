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
