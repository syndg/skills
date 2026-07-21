Quickstart:

```bash
npx skills add mattpocock/skills --skill=setup-matt-pocock-skills
```

```bash
npx skills update setup-matt-pocock-skills
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/engineering/setup-matt-pocock-skills)

## What it does

`setup-matt-pocock-skills` teaches one repo how the engineering skills should behave in it — where issues live, what the triage labels are called, and where the domain docs sit — and records those answers as **config** the other skills read.

It writes config, it does not hard-code behaviour. This one-time bootstrap discovers the actual repo — its remote, installed skills, existing `AGENTS.md` hierarchy, and local tracker conventions — then produces the `docs/agents/` config the engineering chain reads. It is prompt-driven: explore, recommend, confirm, then write.

## When to reach for it

You invoke this by typing `/setup-matt-pocock-skills` — the agent won't reach for it on its own.

Reach for it **once per repo, before the first use of any other engineering skill**. If [triage](https://aihero.dev/skills-triage), [to-spec](https://aihero.dev/skills-to-spec), or [to-tickets](https://aihero.dev/skills-to-tickets) start guessing where your issues live or applying labels that don't exist, they haven't been set up here yet. Re-run it only to switch issue trackers or start over — day-to-day tweaks are just edits to `docs/agents/*.md`.

## The three setup sections

It leads each with a recommended answer you can accept in a word, and skips whatever it can already infer — so most runs are a couple of quick confirmations:

- **Issue tracker** — where work is tracked, so `triage`/`to-spec`/`to-tickets` know whether to call `gh`, `glab`, write markdown under `.scratch/`, or follow a workflow you describe. GitHub, GitLab, local markdown, or other. (It proposes the one that matches your `git remote`.)
- **Triage labels** — asked only if the `triage` skill is installed, and then just: keep the default labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)? Say no only if your tracker already uses other names, so `triage` applies real ones instead of creating duplicates.
- **Domain docs** — the fixed AGENTS/DOX convention: a root `AGENTS.md`, with child documents only at durable ownership boundaries and linked through `## Child DOX Index`. It proposes a root-only chain by default; monorepo signals may justify child boundaries but do not require them.

The output is `docs/agents/issue-tracker.md` and `docs/agents/domain.md`, plus `docs/agents/triage-labels.md` when `triage` is installed; an `## Agent skills` block points to them from `CLAUDE.md` when present or the root `AGENTS.md` otherwise. Setup also establishes the minimal root `AGENTS.md` needed to anchor the DOX chain without creating empty domain sections.

## It's working if

- `issue-tracker.md` and `domain.md` land under `docs/agents/` (plus `triage-labels.md` when `triage` is installed), an `## Agent skills` section appears in `CLAUDE.md` or the root `AGENTS.md`, and the root `AGENTS.md` anchors the DOX chain.
- The tracker it proposes matches your real `git remote`, and the labels match strings that already exist in your repo.
- Afterwards, `triage` and `to-tickets` act on the right place with the right labels instead of asking or guessing.

## Where it fits

`setup-matt-pocock-skills` is a **run-once setup** — the foundation the whole engineering set stands on, not a step you repeat. Its neighbours are the skills that read what it writes: [triage](https://aihero.dev/skills-triage), because it applies the label vocabulary configured here, and [to-spec](https://aihero.dev/skills-to-spec) / [to-tickets](https://aihero.dev/skills-to-tickets), because they publish into the issue tracker configured here. Run it first; everything downstream assumes it has. When you're unsure which skill or flow fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
