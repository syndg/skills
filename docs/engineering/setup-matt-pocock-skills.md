## What it does

`setup-matt-pocock-skills` answers three repository-level questions: where issues live, what the triage labels are called, and how engineering skills find the canonical domain contract. It writes the answers under `docs/agents/` and adds a small pointer block to the repository's root instruction file.

The first contract check happens before repository exploration. If `dox.config.json` exists, configured DOX records stay canonical. If it does not, setup may create or preserve a root-to-nearest `AGENTS.md` fallback. It never initializes DOX implicitly.

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
| An `## Agent skills` block | an existing root instruction file; if none exists, setup asks which file the harness reads |
| A minimal root contract anchor | root `AGENTS.md`, only in the unconfigured fallback |

All of it is committed Markdown. There is no user-level or global mode. If `dox.config.json` exists, the configured DOX records remain the source of truth. Setup does not run `dox init`. When initialization is wanted, [dox](https://aihero.dev/skills-dox) previews `dox init`; `dox init --apply` runs only after the human explicitly approves that proposal.

## The three setup sections

Setup checks `dox.config.json` first, then explores only the selected contract branch. It leads each section with the recommended answer and skips choices the repository has already settled.

| Decision | What it proposes | When it asks |
| --- | --- | --- |
| **Issue tracker** | the tracker matching `git remote` | always |
| **Triage labels** | the five canonical names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) | only when `triage` is available |
| **Domain docs** | configured DOX direct cutover when `dox.config.json` exists; root-to-nearest `AGENTS.md` fallback otherwise | once, to confirm the selected branch |

The tracker options are:

| Option | Where issues live | Needs |
| --- | --- | --- |
| **GitHub** | the repository's GitHub Issues | the `gh` CLI |
| **GitLab** | the repository's GitLab Issues | the `glab` CLI |
| **Local Markdown** | files under `.scratch/<feature>/` | nothing external |
| **Other** | wherever you specify | one paragraph describing the workflow |

The first three have ready-made templates. Local Markdown is a first-class alternative for solo projects and repositories with no remote, not an extra layer on top of GitHub. The "Other" path records a programmable Jira, Linear, Azure DevOps, Beads, or custom workflow as prose that downstream skills follow.

The domain-doc branches are mutually exclusive:

| Trigger | Canonical store | What setup may add |
| --- | --- | --- |
| `dox.config.json` exists | records returned through `/dox` | consumer pointers only; no AGENTS domain hierarchy, mirrored decisions, or `DECISIONS.md` |
| `dox.config.json` is absent | root-to-nearest `AGENTS.md` fallback | a root-only default, plus children only at durable ownership boundaries |

In the fallback branch, parents pass down Ubiquitous Language and Architectural Decisions, direct children appear in **Child DOX Index**, and large inline decision sections may graduate to co-located `DECISIONS.md`. In the configured branch, `/dox` resolves and validates records and [domain-modeling](https://aihero.dev/skills-domain-modeling) owns semantic changes.

## Common questions

**Do I have to use GitHub?**
No. GitHub, GitLab, and local Markdown under `.scratch/` have built-in templates, and any other programmable tracker works through the "Other" path. The tracker is a repository setup answer, not a property of the skills.

**Do I need to rerun it after the skill set changes?**
Usually only when the generated configuration no longer matches the skills that read it, when you switch trackers, or when you want to start over. The seed templates can evolve, so rerunning is a cheap recovery if a downstream skill behaves differently from the checked-in docs. Review the proposed edits before accepting them.

**It wrote the pointer block to `CLAUDE.md`, but my harness reads `AGENTS.md`.**
The selection rule prefers an existing `CLAUDE.md`, then an existing root `AGENTS.md`; if neither exists, setup asks which file the harness reads. Move the pointer block to the active instruction file. Only an unconfigured AGENTS-based repository needs a root `AGENTS.md` domain anchor. In a configured DOX repository, an `AGENTS.md` may carry the pointer without becoming a parallel domain store.

**It did not create my triage labels.**
It is not meant to. `docs/agents/triage-labels.md` maps the five canonical roles to label strings that already exist in your tracker; it does not call a label-creation command. Create missing state and category labels once through the tracker. Wayfinder-specific labels are separate and are not created here either.

**Can I configure grilling cadence, question format, or tone here?**
No. It configures tracker operations, label vocabulary, and domain-doc discovery. Put standing interaction preferences in the instruction file your harness reads. That keeps setup inspectable and avoids turning repository configuration into a general preference system.

**Can I keep the configuration in my home directory instead of committing it?**
Not today. There is no user-level mode. Every repository carries its own `docs/agents/` files so teammates and agents can inspect the same operational contract.

**What happens if this is already a configured DOX project?**
Setup preserves that direct-cutover contract. It records that `/dox` resolves configured records and `domain-modeling` owns semantic updates. It creates no `DECISIONS.md`, duplicates no records into `AGENTS.md`, and initializes no store. DOX initialization remains an explicit `/dox` task whose apply step needs human approval.

**Is it strange to have one skill configure the others?**
The trade-off is real. Without setup, tracker instructions would be duplicated in every skill that touches issues. The mitigation is that the output is ordinary inspectable Markdown. Day-to-day corrections are direct edits to `docs/agents/*.md` and the owning instruction file, not opaque runtime state.

## It's working if

- `docs/agents/issue-tracker.md` and `docs/agents/domain.md` exist, plus `triage-labels.md` when `triage` is available.
- The instruction file your harness reads contains an `## Agent skills` pointer block.
- The proposed tracker matches the real remote, and mapped label strings already exist in that tracker.
- With no `dox.config.json`, the repository has a root fallback, root-to-nearest inheritance, and no speculative child contracts.
- Every fallback child `AGENTS.md` appears in its parent's **Child DOX Index**.
- With `dox.config.json`, records still resolve through `/dox`, no parallel decision store exists, and setup did not enumerate an AGENTS domain hierarchy.
- Afterwards, `/to-tickets` publishes without asking where issues live and `/triage` applies configured labels rather than inventing them.
- No `SKILL.md` changed as a side effect of setup.

## Where it fits

`setup-matt-pocock-skills` is the **run-once setup** for the engineering flow. [triage](https://aihero.dev/skills-triage) applies its label vocabulary; [to-spec](https://aihero.dev/skills-to-spec), [to-tickets](https://aihero.dev/skills-to-tickets), and [wayfinder](https://aihero.dev/skills-wayfinder) use its issue tracker. [domain-modeling](https://aihero.dev/skills-domain-modeling) maintains the selected contract store, while [dox](https://aihero.dev/skills-dox) owns retrieval and structural validation when `dox.config.json` exists. [Ask-matt](https://aihero.dev/skills-ask-matt) routes the whole set.
