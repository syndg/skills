Quickstart:

```bash
npx skills add mattpocock/skills --skill=dox
```

```bash
npx skills update dox
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/engineering/dox)

## What it does

`dox` retrieves the contract records that apply to the work at hand and validates their structure as they change. It makes durable project knowledge available to the agent before a flow reasons from it.

Its defining constraint is structural: `dox` retrieves and validates records, but it does not adjudicate what a term, relationship, or decision means. Use [domain-modeling](https://aihero.dev/skills-domain-modeling) for that semantic work.

## When to reach for it

Type `/dox`, or the agent reaches for it automatically when a task fits.

Reach for it when a project has DOX records and work needs its applicable contract retrieved or its record structure checked. For resolving ambiguous terminology or deciding whether a trade-off deserves a durable decision, use [domain-modeling](https://aihero.dev/skills-domain-modeling) instead.

## Prerequisites

Resolution requires a project-local `dox.config.json` and its configured records. Project setup is always explicit: inspect `dox init`, then run `dox init --apply` only when you intend to initialize the current repository. Installing or invoking the skill never initializes a project automatically.

## The contract layer

`dox` is the automatic **contract-retrieval and structural-validation** layer underneath engineering flows. It keeps the relevant record-shaped knowledge present and well-formed so the skills doing design or implementation can reason from one coherent contract.

Resolution also surfaces optional source path, heading, and digest metadata, so migrated records remain traceable to the exact frozen source section without reading a second runtime source.

## Where it fits

`dox` is a **reach-for-it-anytime standalone** that most often runs beneath another flow. Its closest neighbor is [domain-modeling](https://aihero.dev/skills-domain-modeling), because that skill supplies the semantic adjudication for terminology and durable decisions; [ask-matt](https://aihero.dev/skills-ask-matt) maps both layers into the larger engineering flows.
