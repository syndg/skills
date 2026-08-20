Quickstart:

```bash
npx skills add mattpocock/skills --skill=domain-modeling
```

```bash
npx skills update domain-modeling
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling)

## What it does

`domain-modeling` builds and sharpens a project's **ubiquitous language** as you design — challenging fuzzy terms, stress-testing relationships with concrete scenarios, and recording the terminology and decisions that crystallise.

This is the active discipline, not the passive one. Merely reading the applicable project contract to borrow its vocabulary is a normal codebase habit; this skill is for changing the model — coining a canonical term, catching a contradiction between the code and what you just said, or deciding whether a hard-to-reverse choice deserves a durable record. In a project with `dox.config.json`, settled terminology and decision semantics live as DOX records; this skill still adjudicates their meaning.

## When to reach for it

Type `/domain-modeling`, or the agent reaches for it automatically when a task fits.

Reach for it when the *words* are the problem: two people mean different things by “cancellation”, “account” is doing three jobs, or a design conversation keeps snagging on a concept that has never been named precisely. If the module's *shape* is the problem — where the seam goes or how deep the interface is — use [codebase-design](https://aihero.dev/skills-codebase-design). If a project needs its DOX contract records retrieved or structurally validated, use [dox](https://aihero.dev/skills-dox).

## Prerequisites

In a DOX project, `dox.config.json` and its configured records must be present. The skill uses [dox](https://aihero.dev/skills-dox) to retrieve the applicable records and validate their structure.

## Semantic adjudication

The leading work is **adjudication**: resolving what the project means, rather than merely storing text. The skill compares the conversation with inherited terminology, exposes conflicts, and makes relationships, ownership, boundaries, cardinality, lifecycle, and failure behavior precise. Code is evidence, not automatic truth.

A durable decision earns a record only when it is hard to reverse, surprising without context, and the result of a real trade-off. Miss any one of those bars and it remains conversation, not contract.

## Where it fits

`domain-modeling` is a **reach-for-it-anytime standalone** that runs underneath other skills as often as at a fixed step. [dox](https://aihero.dev/skills-dox) is its contract-layer neighbor: it retrieves and structurally validates DOX records while `domain-modeling` determines their semantics. [grill-with-docs](https://aihero.dev/skills-grill-with-docs) uses the discipline while an idea is sharpened, and [ask-matt](https://aihero.dev/skills-ask-matt) maps both into the wider engineering flows.
