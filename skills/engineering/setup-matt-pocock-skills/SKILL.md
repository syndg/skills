---
name: setup-matt-pocock-skills
description: Configure this repo for the engineering skills — set up its issue tracker, triage label vocabulary, and AGENTS/DOX domain documentation. Run once before first use of the other engineering skills.
disable-model-invocation: true
---

# Setup Matt Pocock's Skills

Scaffold the per-repo configuration that the engineering skills assume:

- **Issue tracker** — where issues live (GitHub by default; local markdown is also supported out of the box)
- **Triage labels** — the strings used for the five canonical triage roles
- **Domain docs** — the AGENTS/DOX hierarchy where domain language and architectural decisions live, and the consumer rules for reading it

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config` — is this a GitHub repo? Which one?
- `AGENTS.md` and `CLAUDE.md` at the repo root — does either exist? Is there already an `## Agent skills` section in either?
- Every `AGENTS.md` from the repo root down — what DOX hierarchy already exists, and do the documents have `## Change Protocol`, `## Ubiquitous Language`, `## Architectural Decisions`, or `## Child DOX Index` sections?
- `docs/agents/` — does this skill's prior output already exist?
- `.scratch/` — sign that a local-markdown issue tracker convention is already in use
- Is the `triage` skill installed? (a `triage` skill folder alongside this one, or `triage` in your available skills.) This decides whether Section B runs at all.
- Monorepo signals — a `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. Present only in a genuinely large multi-package repo; their absence means single-context, which is almost every repo.

### 2. Present findings and ask

Summarise what's present and what's missing. Then take the sections in order — one section, one answer or confirmation, then the next.

Lead each section with the recommended answer so the user can accept it in a word. Give a one-line explainer only when the choice genuinely branches. Skip Section B when `triage` isn't installed. Section C is the fixed AGENTS/DOX convention: present the discovered hierarchy and its root-only default for confirmation.

**Section A — Issue tracker.**

> Explainer: The "issue tracker" is where issues live for this repo. Skills like `to-tickets`, `triage`, `to-spec`, and `qa` read from and write to it — they need to know whether to call `gh issue create`, write a markdown file under `.scratch/`, or follow some other workflow you describe. Pick the place you actually track work for this repo.

Default posture: these skills were designed for GitHub. If a `git remote` points at GitHub, propose that. If a `git remote` points at GitLab (`gitlab.com` or a self-hosted host), propose GitLab. Otherwise (or if the user prefers), offer:

- **GitHub** — issues live in the repo's GitHub Issues (uses the `gh` CLI)
- **GitLab** — issues live in the repo's GitLab Issues (uses the [`glab`](https://gitlab.com/gitlab-org/cli) CLI)
- **Local markdown** — issues live as files under `.scratch/<feature>/` in this repo (good for solo projects or repos without a remote)
- **Other** (Jira, Linear, etc.) — ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose

Record the choice in `docs/agents/issue-tracker.md`. The GitHub and GitLab templates carry a "PRs as a request surface" flag, defaulted **off** — leave it off and don't raise it; a user who wants external PRs in the triage queue can flip the flag in the file later.

**Section B — Triage label vocabulary.** Skip this section entirely if the `triage` skill isn't installed (exploration told you) — an uninstalled skill needs no labels.

If it is installed, ask exactly one question:

> Do you want to keep the default triage labels? (recommended: **yes**)

The defaults are the five canonical roles, each label string equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. On **yes**, write them as-is. Only if the user says no — usually because their tracker already uses other names (e.g. `bug:triage` for `needs-triage`) — collect the overrides so `triage` applies existing labels instead of creating duplicates.

**Section C — Domain docs.** Use the fixed AGENTS/DOX hierarchy, rooted at `AGENTS.md`.

> Explainer: Some skills (`improve-codebase-architecture`, `diagnosing-bugs`, `tdd`) read the applicable `AGENTS.md` chain to learn the project's domain language and past architectural decisions. The chain runs from the repo root to the nearest document that owns the area being changed; parent language and decisions are inherited. Domain language lives inline under `## Ubiquitous Language`, globally numbered ADR entries live inline under `## Architectural Decisions`, and each parent keeps its `## Child DOX Index` current.

This layout is not configurable. Present the hierarchy you found and confirm that its ownership boundaries match the repo:

- **Root `AGENTS.md`** — repository-wide language, decisions, and inherited contracts.
- **Child `AGENTS.md` files** — app-, package-, or subtree-specific additions, created only for durable local boundaries and linked from the parent's `## Child DOX Index`.

Default: keep a root-only chain unless the repo already has, or clearly needs, a durable child boundary. Monorepo signals can justify a child boundary, but do not require one. Follow the nearest owning document's `## Change Protocol`; don't create empty domain-language or decision sections upfront.

### 3. Confirm and edit

Show the user a draft of:

- The `## Agent skills` block to add to whichever of `CLAUDE.md` / `AGENTS.md` is being edited (see step 4 for selection rules)
- Any minimal changes needed to establish the root `AGENTS.md` and keep its DOX chain coherent
- The contents of `docs/agents/issue-tracker.md` and `docs/agents/domain.md`, plus `docs/agents/triage-labels.md` only when `triage` is installed

Let them edit before writing.

### 4. Write

**Pick the file for the `## Agent skills` block:**

- If `CLAUDE.md` exists, edit it.
- Otherwise, edit the root `AGENTS.md`, creating it if necessary.

Always ensure a root `AGENTS.md` exists to anchor the DOX chain, even when the `## Agent skills` block lives in `CLAUDE.md`. Preserve existing instructions and follow its `## Change Protocol`. When creating or substantially structuring it, use the `/domain-modeling` skill's [AGENTS-FORMAT.md](../domain-modeling/AGENTS-FORMAT.md); use [ADR-FORMAT.md](../domain-modeling/ADR-FORMAT.md) for inline decisions. Create domain sections and child documents lazily, only when they have useful content.

If an `## Agent skills` block already exists in the chosen file, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.

The block:

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary of the root-to-nearest AGENTS/DOX hierarchy]. See `docs/agents/domain.md`.
```

Include the `### Triage labels` sub-block, and write `docs/agents/triage-labels.md`, only when `triage` is installed and Section B ran. When it isn't, both are omitted.

Then write the docs files using the seed templates in this skill folder as a starting point:

- [issue-tracker-github.md](./issue-tracker-github.md) — GitHub issue tracker
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — GitLab issue tracker
- [issue-tracker-local.md](./issue-tracker-local.md) — local-markdown issue tracker
- [triage-labels.md](./triage-labels.md) — label mapping (only if `triage` is installed)
- [domain.md](./domain.md) — consumer rules for the AGENTS/DOX hierarchy

For "other" issue trackers, write `docs/agents/issue-tracker.md` from scratch using the user's description.

### 5. Done

Tell the user the setup is complete and which engineering skills will now read from these files and the applicable `AGENTS.md` chain. Mention they can edit `docs/agents/*.md` and the owning `AGENTS.md` directly later — re-running this skill is only necessary if they want to switch issue trackers or restart from scratch.
