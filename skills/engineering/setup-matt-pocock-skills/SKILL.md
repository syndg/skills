---
name: setup-matt-pocock-skills
description: Configure a repository's issue tracker, triage labels, and contract lookup. Preserve configured DOX records as canonical; scaffold the AGENTS fallback only when `dox.config.json` is absent.
disable-model-invocation: true
---

# Setup Matt Pocock's skills

Set up the per-repository configuration used by the engineering skills:

- **Issue tracker**: where issues live.
- **Triage labels**: the strings for the five canonical triage roles.
- **Domain docs**: how skills resolve the repository's canonical contract.

This is prompt-driven setup. Discover the repository, present a draft, get confirmation, then write.

## Process

### 1. Select contract storage before exploration

Check for `dox.config.json` before reading source, history, or repository instructions. Its presence selects one of two mutually exclusive branches.

**Configured DOX branch.** Invoke `/dox` for this setup task before further repository exploration. Treat the configured records as canonical. Use the compact resolved items to understand ownership and existing contract pointers. Do not enumerate the configured record directory or every `AGENTS.md`, build an AGENTS domain hierarchy, mirror records into `AGENTS.md`, or create `DECISIONS.md`.

**Unconfigured AGENTS fallback.** When `dox.config.json` is absent, inspect the root instruction files, the existing root-to-nearest `AGENTS.md` paths for likely work areas, and any relevant co-located `DECISIONS.md` entries those chains index. This branch may scaffold a root-only fallback or preserve durable child boundaries already present.

This skill never initializes DOX implicitly. Do not run `dox init --apply` unless the human explicitly asks to initialize DOX, has reviewed the proposal from `dox init`, and approves applying that proposal.

### 2. Explore the selected branch

Inspect the rest of the repository's setup without crossing the storage boundary:

- `git remote -v` and `.git/config`: identify the issue tracker host.
- Root `AGENTS.md` and `CLAUDE.md`: find an existing `## Agent skills` pointer block. In the configured branch, read these only as root instruction files, not as a parallel domain store.
- `docs/agents/`: find prior setup output.
- `.scratch/`: detect an existing local Markdown issue tracker convention.
- The installed skills: run the triage-label section only when `triage` is installed.
- Monorepo signals such as `pnpm-workspace.yaml`, a `workspaces` field, or populated package source trees. Use these only to propose fallback ownership boundaries in the unconfigured branch.

Summarize what exists and what is missing. Then present Sections A through C in order, one answer or confirmation at a time. Lead with the recommendation and explain only real branches.

### 3. Confirm the setup choices

**Section A: issue tracker.**

Recommend GitHub when a remote points there, GitLab for a GitLab remote, and otherwise offer:

- **GitHub**: issues live in GitHub Issues through `gh`.
- **GitLab**: issues live in GitLab Issues through `glab`.
- **Local Markdown**: issues live under `.scratch/<feature>/`.
- **Other**: ask for one paragraph describing a programmable Jira, Linear, or custom workflow.

Write the choice to `docs/agents/issue-tracker.md`. The GitHub and GitLab templates keep "PRs as a request surface" off by default. Leave it off unless the user changes it.

**Section B: triage label vocabulary.** Skip this section when `triage` is not installed.

Ask one question:

> Do you want to keep the default triage labels? (recommended: **yes**)

The defaults are `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. If the user declines, collect mappings to their existing labels rather than creating duplicates.

**Section C: domain docs.** Present only the selected branch.

- **Configured DOX**: confirm that `dox.config.json` selects direct-cutover retrieval through `/dox`. Preserve the configured records and ownership. Setup adds consumer pointers only; it creates no AGENTS domain hierarchy or duplicate decision ledger.
- **Unconfigured AGENTS fallback**: confirm the root-to-nearest hierarchy. Default to a root-only `AGENTS.md`. Add child documents only for durable subtree ownership, and list them in the parent's `## Child DOX Index`. Keep domain language under `## Ubiquitous Language`; keep globally numbered decisions under `## Architectural Decisions`, with co-located `DECISIONS.md` only after that section outgrows the hot path.

Show the user a draft of:

- the `## Agent skills` block;
- `docs/agents/issue-tracker.md` and `docs/agents/domain.md`;
- `docs/agents/triage-labels.md` when Section B ran;
- only in the unconfigured branch, any minimal fallback `AGENTS.md` changes.

Let the user revise the draft before writing.

### 4. Write

Pick the root instruction file for the `## Agent skills` block:

- Prefer an existing `CLAUDE.md`.
- Otherwise use an existing root `AGENTS.md`.
- If neither exists, ask which instruction file the active harness reads before creating one. In the configured branch, a new `AGENTS.md` may hold the pointer block only; it does not become a domain hierarchy.

In the unconfigured branch, ensure the root fallback `AGENTS.md` exists. Preserve current instructions and follow its `## Change Protocol`. Use the `/domain-modeling` skill's [AGENTS-FORMAT.md](../domain-modeling/AGENTS-FORMAT.md) and [ADR-FORMAT.md](../domain-modeling/ADR-FORMAT.md). Create domain sections and children only when they have useful content.

Update an existing `## Agent skills` block in place. Do not append a duplicate or overwrite surrounding user instructions.

Use this shape:

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary: configured DOX direct cutover, or unconfigured root-to-nearest AGENTS fallback]. See `docs/agents/domain.md`.
```

Include the triage sub-block and file only when Section B ran.

Write the docs from these seed files:

- [issue-tracker-github.md](./issue-tracker-github.md)
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md)
- [issue-tracker-local.md](./issue-tracker-local.md)
- [triage-labels.md](./triage-labels.md), when `triage` is installed
- [domain.md](./domain.md), preserving its mutually exclusive storage branches

For another issue tracker, write `docs/agents/issue-tracker.md` from the user's description.

### 5. Finish

Report the chosen issue tracker, label mapping, and contract branch. In a configured repository, name `/dox` and the configured records as canonical. In an unconfigured repository, name the applicable root-to-nearest `AGENTS.md` chain and indexed co-located `DECISIONS.md` fallback. Re-run setup only to change these repository-level choices.
