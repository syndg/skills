## What it does

`setup-matt-pocock-skills` answers three questions about one repository: where issues live, what the triage labels are called, and how engineering skills find the applicable domain contract. It records the answers as Markdown under `docs/agents/` and adds a small pointer block to the repository's existing instruction file.

It writes configuration, not hard-coded behaviour. The engineering skills remain the same across repositories; they read `docs/agents/issue-tracker.md`, the label mapping, and the domain-doc rules at runtime. This one-time bootstrap discovers the actual repository, proposes what it found, waits for confirmation, and then writes. It never initializes a DOX project implicitly.

## When to reach for it

You invoke this by typing `/setup-matt-pocock-skills`; the [agent](https://www.aihero.dev/ai-coding-dictionary/agent) will not reach for it on its own. No other skill fires it for you.

Reach for it once per repository, before the first use of engineering skills that publish or triage issues. If [triage](https://aihero.dev/skills-triage), [to-spec](https://aihero.dev/skills-to-spec), [to-tickets](https://aihero.dev/skills-to-tickets), or [wayfinder](https://aihero.dev/skills-wayfinder) starts guessing where issues go or which labels exist, setup has not been completed here. Running it midway through a project is safe because it reads and preserves the conventions already present.

## Prerequisites

It writes into the repository you run it in:

| It writes | Where |
| --- | --- |
| `issue-tracker.md` | `docs/agents/` |
| `domain.md` | `docs/agents/` |
| `triage-labels.md` | `docs/agents/`, only when `triage` is available |
| An `## Agent skills` block | the existing root `CLAUDE.md`, or root `AGENTS.md` when no `CLAUDE.md` exists |
| A minimal root contract anchor | root `AGENTS.md`, when the repository uses the AGENTS hierarchy |

All of it is committed Markdown. There is no user-level or global mode, so every repository gets its own configuration. If `dox.config.json` already exists, the configured DOX records remain the structured source of truth. This skill does not run `dox init`; inspect `dox init` and apply it explicitly through [dox](https://aihero.dev/skills-dox) when initialization is actually wanted.

## The three setup sections

It leads each section with the recommended answer and skips exploration that the repository has already settled. Most runs need only a few confirmations.

| Decision | What it proposes | When it asks |
| --- | --- | --- |
| **Issue tracker** | the tracker matching `git remote` | always, because this is the real branch |
| **Triage labels** | the five canonical names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) | only when `triage` is available |
| **Domain docs** | the existing configured DOX project, or a root-to-nearest `AGENTS.md` hierarchy with a root-only default | whenever ownership boundaries need confirmation |

The tracker options are:

| Option | Where issues live | Needs |
| --- | --- | --- |
| **GitHub** | the repository's GitHub Issues | the `gh` CLI |
| **GitLab** | the repository's GitLab Issues | the `glab` CLI |
| **Local Markdown** | files under `.scratch/<feature>/` | nothing external |
| **Other** | wherever you specify | one paragraph describing the workflow |

The first three have ready-made templates. Local Markdown is a first-class alternative for solo projects and repositories with no remote, not an extra layer on top of GitHub. The "Other" path records a programmable Jira, Linear, Azure DevOps, Beads, or custom workflow as prose that downstream skills follow.

The AGENTS domain layout is fixed rather than configurable:

- **Root `AGENTS.md`** owns repository-wide Ubiquitous Language, Architectural Decisions, and inherited contracts.
- **Child `AGENTS.md` files** add app-, package-, or subtree-specific language and decisions only at durable ownership boundaries.
- Every parent lists direct children in **Child DOX Index**.
- Skills read from the repository root down to the nearest owning document and inherit parent language and decisions.
- Decisions stay inline in the nearest owner while small. When they dominate that file, their bodies graduate to a co-located `DECISIONS.md` while the numbered index remains in `AGENTS.md`.

A configured DOX project follows its record layout instead. `/dox` resolves and structurally validates the records; [domain-modeling](https://aihero.dev/skills-domain-modeling) adjudicates semantic changes. Setup records that convention but does not create a parallel AGENTS decision ledger or initialize DOX.

## Common questions

**Do I have to use GitHub?**
No. GitHub, GitLab, and local Markdown under `.scratch/` have built-in templates, and any other programmable tracker works through the "Other" path. The tracker is a repository setup answer, not a property of the skills.

**Do I need to rerun it after the skill set changes?**
Usually only when the generated configuration no longer matches the skills that read it, when you switch trackers, or when you want to start over. The seed templates can evolve, so rerunning is a cheap recovery if a downstream skill behaves differently from the checked-in docs. Review the proposed edits before accepting them.

**It wrote the pointer block to `CLAUDE.md`, but my harness reads `AGENTS.md`.**
The local selection rule is based on file presence: use `CLAUDE.md` when it exists, otherwise use root `AGENTS.md`. It does not detect which [harness](https://www.aihero.dev/ai-coding-dictionary/harness) is active. Move the pointer block to the instruction file your harness reads, or keep `AGENTS.md` canonical and make the other file point to it. The root `AGENTS.md` still anchors the domain hierarchy.

**It did not create my triage labels.**
It is not meant to. `docs/agents/triage-labels.md` maps the five canonical roles to label strings that already exist in your tracker; it does not call a label-creation command. Create missing state and category labels once through the tracker. Wayfinder-specific labels are separate and are not created here either.

**Can I configure grilling cadence, question format, or tone here?**
No. It configures tracker operations, label vocabulary, and domain-doc discovery. Put standing interaction preferences in the instruction file your harness reads. That keeps setup inspectable and avoids turning repository configuration into a general preference system.

**Can I keep the configuration in my home directory instead of committing it?**
Not today. There is no user-level mode. Every repository carries its own `docs/agents/` files so teammates and agents can inspect the same operational contract.

**What happens if this is already a configured DOX project?**
Setup must preserve that direct-cutover contract. It records that `/dox` resolves the configured records and that `domain-modeling` owns semantic updates. It does not create `DECISIONS.md`, duplicate records into `AGENTS.md`, or initialize another store. DOX initialization remains an explicit `/dox` task.

**Is it strange to have one skill configure the others?**
The trade-off is real. Without setup, tracker instructions would be duplicated in every skill that touches issues. The mitigation is that the output is ordinary inspectable Markdown. Day-to-day corrections are direct edits to `docs/agents/*.md` and the owning instruction file, not opaque runtime state.

## It's working if

- `docs/agents/issue-tracker.md` and `docs/agents/domain.md` exist, plus `triage-labels.md` when `triage` is available.
- The instruction file your harness reads contains an `## Agent skills` pointer block.
- The proposed tracker matches the real remote, and mapped label strings already exist in that tracker.
- An AGENTS-based repository has a root anchor, root-to-nearest inheritance, and no speculative child contracts.
- Every child `AGENTS.md` appears in its parent's **Child DOX Index**.
- A configured DOX repository continues to resolve records through `/dox` with no parallel decision store.
- Afterwards, `/to-tickets` publishes without asking where issues live and `/triage` applies configured labels rather than inventing them.
- No `SKILL.md` changed as a side effect of setup.

## Where it fits

`setup-matt-pocock-skills` is the **run-once setup** for the engineering flow, a precondition rather than a chain step. Its neighbours are its readers: [triage](https://aihero.dev/skills-triage) applies the label vocabulary; [to-spec](https://aihero.dev/skills-to-spec) and [to-tickets](https://aihero.dev/skills-to-tickets) publish to the named tracker; and [wayfinder](https://aihero.dev/skills-wayfinder) uses the same tracker operations for maps and child [tickets](https://www.aihero.dev/ai-coding-dictionary/ticket). The domain layout it records is filled lazily by [domain-modeling](https://aihero.dev/skills-domain-modeling), while [dox](https://aihero.dev/skills-dox) owns retrieval and structural validation in configured DOX projects. [Ask-matt](https://aihero.dev/skills-ask-matt) routes the whole set.
