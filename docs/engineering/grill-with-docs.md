Quickstart:

```bash
npx skills add mattpocock/skills --skill=grill-with-docs
```

```bash
npx skills update grill-with-docs
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs)

## What it does

`grill-with-docs` interviews you relentlessly about a plan or design, one question at a time, until you and the agent reach a shared understanding — and it writes the vocabulary and decisions down as you go.

The grilling **leaves a paper trail**. A plain interview sharpens your thinking and then evaporates when the session ends; this one captures each term the moment it's resolved in the applicable `AGENTS.md` chain's `## Ubiquitous Language`, and records hard, one-way decisions as globally numbered architectural decisions. The alignment survives the conversation instead of living only in your head.

## When to reach for it

You invoke this by typing `/grill-with-docs` — the agent won't reach for it on its own.

Reach for it at the very start of a change, when the plan is still fuzzy and the domain language isn't settled, and you want to stress-test both before any code exists. If you only want the interview and don't need the artifacts, use [grilling](https://aihero.dev/skills-grilling); if the plan is already clear and you just need to pin down or record terminology, use [domain-modeling](https://aihero.dev/skills-domain-modeling). And if the change is too big to hold in one session and its route is still foggy — a greenfield project, a huge feature build — start upstream with [wayfinder](https://aihero.dev/skills-wayfinder): it charts the effort as a map of decisions, then hands back to this main flow once the way is clear.

## Prerequisites

This skill is stateful — it writes into your repo as it grills. Resolved terms and genuinely hard-to-reverse decisions land in the nearest owning `AGENTS.md`, inheriting repository-wide context from the root; a decision section that outgrows the hot path graduates to a co-located `DECISIONS.md`. Sections and child documents are created lazily, so you need somewhere it is safe to write but no empty scaffold upfront.

## The grill

The engine is a **grill**: a relentless, one-question-at-a-time walk down the decision tree, resolving dependencies between decisions before moving on, with a recommended answer offered for every question. Questions the codebase can answer are answered by reading the codebase, not by asking you.

What makes this variant its own skill is where the answers go. As the grill runs, fuzzy language gets sharpened into canonical terms and written to the nearest owning `AGENTS.md` inline — not batched at the end. The ubiquitous-language section stays pure vocabulary: no implementation details, no spec. Architectural decisions are offered sparingly, only when a choice is hard to reverse, surprising without context, and the result of a real trade-off. Most sessions produce sharper language and few or no decisions, and that's the intended shape.

## It's working if

- It asks one question at a time and waits, rather than dumping a questionnaire.
- Terms get written to the applicable `AGENTS.md` chain the moment they resolve, in your project's own words.
- It reaches into the codebase to answer its own questions where it can.
- ADRs stay rare — you're not asked to rubber-stamp reversible choices.

## Where it fits

`grill-with-docs` is the opening step of the main build chain:

```txt
grill-with-docs → to-spec → to-tickets → implement → mp-code-review
```

It comes first, before anything is written down as a spec: it produces the shared understanding and settled vocabulary that [to-spec](https://aihero.dev/skills-to-spec) then synthesises into a spec without re-interviewing you. Its close neighbours are [grilling](https://aihero.dev/skills-grilling), the same interview without the docs, and [domain-modeling](https://aihero.dev/skills-domain-modeling), the AGENTS/DOX language-and-decision discipline it drives. When you're unsure which skill or flow fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
