## What it does

`setup-matt-pocock-skills` answers three repository-level questions: where issues live, what the triage labels are called, and how engineering skills find the canonical domain contract. It writes the answers under `docs/agents/` and adds a small pointer block to the repository's root instruction file. In a configured DOX repository, it also places one minimal activation pointer in root `AGENTS.md`.

Those files are the only thing that varies between repos. The skills themselves are identical everywhere. They read `docs/agents/issue-tracker.md` at run time and do what it says. That is why the set is not tied to GitHub, and why you never edit a skill file to point it at another tracker. Invoking it with "link the skills to a custom issue tracker" works with anything you can connect to programmatically, with no changes to the skills.

It is a prompt-driven skill, not a deterministic script. It reads your `git remote`, instruction files and any existing contract files, proposes what it found, and waits for you to confirm before it writes anything.

Contract storage follows `dox.config.json`. Configured records stay canonical, and the installed DOX skill owns conditional retrieval, reuse, and maintenance. Without the config, setup may create or preserve a root-to-nearest `AGENTS.md` fallback. It never initializes DOX implicitly.

## When to reach for it

You invoke this by typing `/setup-matt-pocock-skills`; the [agent](https://www.aihero.dev/ai-coding-dictionary/agent) won't reach for it on its own. Its metadata marks it non-invokable on purpose, so no other skill can fire it for you.

Reach for it once per repo, before the first use of any engineering skill that publishes or triages issues. If [triage](https://aihero.dev/skills-triage), [to-spec](https://aihero.dev/skills-to-spec), [to-tickets](https://aihero.dev/skills-to-tickets) or [wayfinder](https://aihero.dev/skills-wayfinder) start guessing where your issues go, or apply labels your tracker doesn't have, this repo has not been set up yet. You can run it in a repo halfway through a project. The skill reads what is already there, so no earlier work is lost.

## Prerequisites

It writes into the repository you run it in:

| It writes | Where |
| --- | --- |
| `issue-tracker.md` | `docs/agents/` |
| `domain.md` | `docs/agents/` |
| `triage-labels.md` | `docs/agents/`, only when `triage` is available |
| An `## Agent skills` block | an existing root instruction file; if none exists, setup asks which file the harness reads |
| A minimal DOX activation pointer | root `AGENTS.md`, only when `dox.config.json` exists |
| A minimal root contract anchor | root `AGENTS.md`, only in the unconfigured fallback |

You commit all of it as Markdown. There is no user-level or global mode. The config lives in the repo, so every repo gets its own copy. If `dox.config.json` exists, the configured DOX records remain the source of truth. Setup does not run `dox init`. When initialization is wanted, [dox](https://aihero.dev/skills-dox) previews `dox init`; `dox init --apply` runs only after the human explicitly approves that proposal.

## The three setup sections

Setup checks `dox.config.json` first, then explores only the selected contract branch. It starts each section with the recommended answer, and skips any question its exploration already answered.

| Decision | What it proposes | When it asks |
| --- | --- | --- |
| **Issue tracker** | the tracker matching `git remote` | always, because this is the one real choice |
| **Triage labels** | the five canonical names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) | only when `triage` is available |
| **Domain docs** | configured DOX direct cutover when `dox.config.json` exists; root-to-nearest `AGENTS.md` fallback otherwise | once, to confirm the selected branch |

The tracker options are:

| Option | Where issues live | Needs |
| --- | --- | --- |
| **GitHub** | the repository's GitHub Issues | the `gh` CLI |
| **GitLab** | the repository's GitLab Issues | the `glab` CLI |
| **Local Markdown** | files under `.scratch/<feature>/` | nothing external |
| **Other** | wherever you specify | one paragraph describing the workflow |

The first three ship as templates in the skill and work out of the box. Local Markdown is a full option, not a fallback. It suits a solo project with no remote. Don't use it alongside GitHub; they are alternatives, so pick one.

"Other" is a full option too. It is how Jira, Linear, Azure DevOps and Beads all work. You describe the workflow, the skill records your prose in `docs/agents/issue-tracker.md`, and the downstream skills follow the prose. Users have already built this: a Jira-over-[MCP](https://www.aihero.dev/ai-coding-dictionary/mcp) variant, a Gitea CLI shaped like `gh`, a hand-built local dashboard.

The domain-doc branches are mutually exclusive:

| Trigger | Canonical store | What setup may add |
| --- | --- | --- |
| `dox.config.json` exists | records returned through `/dox` | the minimal root `AGENTS.md` activation pointer and consumer pointers; no AGENTS domain hierarchy, mirrored decisions, or `DECISIONS.md` |
| `dox.config.json` is absent | root-to-nearest `AGENTS.md` fallback | a root-only default, plus children only at durable ownership boundaries |

In the fallback branch, parents pass down Ubiquitous Language and Architectural Decisions, direct children appear in **Child DOX Index**, and large inline decision sections may graduate to co-located `DECISIONS.md`. In the configured branch, root `AGENTS.md` points to the installed [dox](https://aihero.dev/skills-dox) skill for eligibility, reuse, and maintenance; [domain-modeling](https://aihero.dev/skills-domain-modeling) adjudicates semantic changes.

## Common questions

**Do I have to use GitHub?**
No. GitHub, GitLab, and local Markdown under `.scratch/` have built-in templates, and any other programmable tracker works through the "Other" path. The tracker is a repository setup answer, not a property of the skills.

**Do I need to rerun it after the skill set changes?**
Usually only when the generated configuration no longer matches the skills that read it, when you switch trackers, or when you want to start over. The skill's own closing message tells you to re-run only to switch trackers or start over. The seed templates change between versions, so a `docs/agents/issue-tracker.md` from an older release can go out of date against the skills that now read it. Rerunning is a cheap recovery if a downstream skill behaves differently from the checked-in docs. Review the proposed edits before accepting them.

**Why did setup write to both `CLAUDE.md` and `AGENTS.md`?**
The `## Agent skills` block goes in the root instruction file selected for the active harness: existing `CLAUDE.md`, then existing `AGENTS.md`, or a file the user chooses when neither exists. In a configured repository, the minimal DOX activation pointer always lives in root `AGENTS.md`. It contains no retrieval procedure or domain ledger; the installed `dox` skill owns that behavior.

**It did not create my triage labels.**
It is not meant to. `docs/agents/triage-labels.md` is a *mapping*: it tells `/triage` which strings in your tracker correspond to the five canonical roles. It does not call a label-creation command, and users have filed this as a bug more than once. Create missing state and category labels once through the tracker. If your tracker already uses the canonical names, the mapping is an identity table and there is nothing to configure. That is the intended common case, not a missing step. Wayfinder's `wayfinder:map` and `wayfinder:<type>` labels are separate and are not created here either, so `gh issue create --label <missing>` fails instead of creating the label. Create them by hand before the first wayfinder run on a GitHub repo.

**Can I configure grilling cadence, question format, or tone here?**
No. It configures tracker operations, label vocabulary, and domain-doc discovery. Put standing interaction preferences in the instruction file your harness reads. That keeps setup inspectable and avoids turning repository configuration into a general preference system.

**Can I keep the configuration in my home directory instead of committing it?**
Not today. A user who runs the skills across many repos has an open request for this, but no user-level mode exists. Every repository carries its own `docs/agents/` files so teammates and agents can inspect the same operational contract.

**What happens if this is already a configured DOX project?**
Setup preserves that direct-cutover contract. It ensures root `AGENTS.md` contains one sentence pointing at the installed `dox` skill, while configured records remain canonical. It creates no `DECISIONS.md`, duplicates no records or DOX workflow into instruction files, and initializes no store. DOX initialization remains an explicit `/dox` task whose apply step needs human approval.

**Is it strange to have one skill configure the others?**
One long-standing complaint says yes: *"having a skill to set up the other skill does not feel right to me: that means the LLM is configuring its own skills."* The trade-off is real. Without setup, tracker instructions would be duplicated in every skill that touches issues. The mitigation is that the output is ordinary inspectable Markdown. Day-to-day corrections are direct edits to `docs/agents/*.md` and the owning instruction file, not opaque runtime state.

## It's working if

- `docs/agents/issue-tracker.md` and `docs/agents/domain.md` exist, plus `triage-labels.md` when `triage` is available.
- The instruction file your harness reads contains an `## Agent skills` pointer block.
- The proposed tracker matches the real remote, and mapped label strings already exist in that tracker.
- With no `dox.config.json`, the repository has a root fallback, root-to-nearest inheritance, and no speculative child contracts.
- Every fallback child `AGENTS.md` appears in its parent's **Child DOX Index**.
- With `dox.config.json`, root `AGENTS.md` contains the minimal activation pointer, records still resolve through `/dox`, and no parallel procedure or decision store exists.
- Afterwards, `/to-tickets` publishes without asking where issues live and `/triage` applies configured labels rather than inventing them.
- No `SKILL.md` changed as a side effect of setup.

## Where it fits

`setup-matt-pocock-skills` is the **run-once setup** for the engineering flow. [triage](https://aihero.dev/skills-triage) applies its label vocabulary; [to-spec](https://aihero.dev/skills-to-spec), [to-tickets](https://aihero.dev/skills-to-tickets), and [wayfinder](https://aihero.dev/skills-wayfinder) use its issue tracker. [domain-modeling](https://aihero.dev/skills-domain-modeling) maintains the selected contract store, while [dox](https://aihero.dev/skills-dox) owns retrieval and structural validation when `dox.config.json` exists. [Ask-matt](https://aihero.dev/skills-ask-matt) routes the whole set.
