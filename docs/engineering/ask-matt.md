Quickstart:

```bash
npx skills add mattpocock/skills --skill=ask-matt
```

```bash
npx skills update ask-matt
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/engineering/ask-matt)

## What it does

`ask-matt` is the router over the skills in this repo. You describe the situation you're in; it tells you which skill or flow fits and in what order to run them.

It does no work itself. It does not grill, write a spec, retrieve a contract, or fix anything — it only orients. It exists for the user-invoked skills above all: nothing fires those for you, so you have to remember they exist, and `ask-matt` is the memory you offload that to. It also points at model-invoked layers such as `/dox`, `/domain-modeling`, and `/codebase-design`, as well as reusable disciplines like `/tdd` and `/diagnosing-bugs`.

## When to reach for it

You invoke this by typing `/ask-matt` — the agent won't reach for it on its own.

Reach for it whenever you're unsure which skill or flow a situation calls for: you have an idea and don't know where to start, a pile of bug reports and don't know if they're for `/triage`, or two skills that look interchangeable and you can't tell them apart. If you already know the skill you want, skip the router and invoke it directly.

## Flows, not just skills

The idea `ask-matt` gives you to think with is the **flow** — a path through the skills rather than a single one. Most work runs along one main flow (idea → ship: grill → spec → tickets → implement → review), on-ramps merge into it for incoming work and hard diagnosis, and standalones serve a focused need. Ask a question and you get placed on the right flow, at the right step — not just handed a tool.

Contract layers run underneath those flows: [dox](https://aihero.dev/skills-dox) retrieves applicable DOX records and validates their structure; [domain-modeling](https://aihero.dev/skills-domain-modeling) adjudicates the meaning of terminology and durable decisions; [codebase-design](https://aihero.dev/skills-codebase-design) supplies the vocabulary for deep modules and clean seams.

The personalized fork also has maintenance routes outside product-development flows: `/pi-update` maintains the Syn Pi fork, while `/skills-fork-update` integrates upstream skills changes while preserving this fork's local conventions and inventory.

## Where it fits

`ask-matt` is the **router** — the standalone map that sits over the whole set. It is the node every other docs page links back to as [ask-matt](https://aihero.dev/skills-ask-matt), so it never sits in a chain; it points into every chain. From here you'll most often land on [grill-with-docs](https://aihero.dev/skills-grill-with-docs), the head of the main flow, or [triage](https://aihero.dev/skills-triage), the on-ramp for work you did not create.
