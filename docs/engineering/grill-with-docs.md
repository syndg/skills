## What it does

`grill-with-docs` interviews you about a plan or design until you and the [agent](https://www.aihero.dev/ai-coding-dictionary/agent) share one understanding of it, and writes the vocabulary and hard decisions into your repository while it does. It is the same interview [grill-me](https://aihero.dev/skills-grill-me) runs, a round of questions followed by your answers and then the next round, pointed at a codebase.

It is **[stateful](https://www.aihero.dev/ai-coding-dictionary/stateful)**. Every other grilling skill leaves the [session](https://www.aihero.dev/ai-coding-dictionary/session) in your head; this one leaves a durable paper trail. A term lands in the nearest owning contract the moment it resolves. A decision passes three gates and lands at the scope it governs. The artifacts are real repository state, so ownership and inheritance matter.

## When to reach for it

You invoke this by typing `/grill-with-docs` — the agent will not reach for it on its own.

Reach for it at the start of a repository change, while the plan is fuzzy and the words are not settled. It is the single-session tool. Which grilling skill you want depends on what is in front of you:

| What you have | Reach for |
| --- | --- |
| You are not working in a repository | [grill-me](https://aihero.dev/skills-grill-me) |
| A repository and a change you can settle in one session | `grill-with-docs` |
| An effort too large for one session, such as a greenfield build or major feature | [wayfinder](https://aihero.dev/skills-wayfinder) |
| A repository with no domain contract and no particular feature in mind | `grill-with-docs`, aimed at the repository |
| A decision blocked on knowledge in someone else's head | [to-questionnaire](https://aihero.dev/skills-to-questionnaire) |

The wayfinder split comes down to session count: `/grill-with-docs` for single-session planning, `/wayfinder` for multi-session planning.

## Prerequisites

The skill writes into your repository, so you need to be somewhere it is safe to write. Select one storage branch:

| Trigger | Contract behavior |
| --- | --- |
| `dox.config.json` exists | `/dox` returns compact items from the applicable structured records and validates their shape. `domain-modeling` adjudicates and writes semantic updates to those canonical records. No parallel `AGENTS.md` / `DECISIONS.md` decision store is created. |
| `dox.config.json` is absent | Read from the root `AGENTS.md` down to the nearest owner. Terms and durable decisions land there, inheriting **Ubiquitous Language** and **Architectural Decisions** from every parent. New sections and child files appear lazily; each child enters its parent's **Child DOX Index**, and large decision bodies graduate to co-located `DECISIONS.md`. |

The skill also needs [grilling](https://aihero.dev/skills-grilling) and [domain-modeling](https://aihero.dev/skills-domain-modeling) available because its own `SKILL.md` delegates to them. `grilling` supplies the interview, and `domain-modeling` supplies the contract updates.

## The paper trail

Three things can come out of a session, and they are not equal.

| What resolved | Configured DOX | Unconfigured fallback |
| --- | --- | --- |
| A term, meaning the project's own word for a thing | The applicable canonical term record | The **Ubiquitous Language** of the nearest owning `AGENTS.md` |
| A decision that is hard to reverse, surprising without context, and a real trade-off | A canonical DOX decision record | The nearest owner's **Architectural Decisions**, graduating later to co-located `DECISIONS.md` |
| Everything else you decided | The conversation, and nowhere else | The conversation, and nowhere else |

That third row catches people out. Ubiquitous Language is deliberately kept as domain vocabulary: no implementation detail, no [spec](https://www.aihero.dev/ai-coding-dictionary/spec), and no scratch notes. Architectural decisions must pass all three gates, so most choices do not qualify and many sessions produce none. A sharper language with zero new decisions is working as designed, but the rest of what you agreed still exists only in the [context window](https://www.aihero.dev/ai-coding-dictionary/context-window). Hand the same conversation to [to-spec](https://aihero.dev/skills-to-spec) rather than [clearing](https://www.aihero.dev/ai-coding-dictionary/clearing) it.

The domain language is the point: the project's own words, agreed once, so you, the agent, and colleagues stop paying to derive them again. The sharpest counterargument is that a canonical term and its plain-English expansion may perform similarly for the model, so the vocabulary primarily compresses communication between humans. That reading still leaves it useful; it simply locates the value more honestly.

## Common questions

**Should I use this or `/wayfinder`?**
Scope decides it. Use this for anything you can settle in one session. Use [wayfinder](https://aihero.dev/skills-wayfinder) when the effort is too large to hold in one, and it charts the work as a map of decision [tickets](https://www.aihero.dev/ai-coding-dictionary/ticket). Wayfinder can still drop into a grilling session for one part of its map.

**It ran, but no contract file changed.**
Two causes are common. First, nothing qualified: the session may introduce no new vocabulary, and architectural decisions need all three gates. Second, the interview primitive loaded without `domain-modeling`, so the conversation worked but the paper trail did not. In an unconfigured `AGENTS.md` repository, check the nearest owner as well as the root. In a configured DOX project, inspect the compact resolved items through `/dox`, not by scanning the record store. Ask the agent which skills it loaded if the result is unclear.

**It asked everything at once, with no recommendations, and never mentioned the domain contract.**
That means its dependencies did not load correctly. A proper `grilling` run asks one dependency-safe frontier per round and gives a recommendation for every question. Partial loading is more confusing: the interview can look right while `domain-modeling` is absent and no semantic update lands. Ask directly which skills are active, then invoke the missing one by name.

**Where did all my other decisions go?**
Into the conversation only. The domain language is not a spec, and most answers do not earn an architectural decision. Precise answers can soften downstream if no artifact carries them. Keep the session and feed it straight to [to-spec](https://aihero.dev/skills-to-spec), then review the spec against your own answers instead of assuming every detail survived.

**Can I point it at an existing repository that has no domain docs?**
Yes. Invoke it with "help me document this repository". It reads the code and asks about what it finds; you decide which existing words are canonical. Check `dox.config.json` first. If present, use the configured record layout and create no parallel AGENTS-based decision store. If absent, start with a root-only `AGENTS.md` unless a durable ownership boundary justifies a child, then link the first child from the parent's **Child DOX Index**.

**What should I do when the session ends?**
In the main flow, run [to-spec](https://aihero.dev/skills-to-spec) in the same conversation. If the change is small enough to build in one session, go directly to [implement](https://aihero.dev/skills-implement).

**Why is it called that?**
The name is imperfect. `grill-domain-model` would describe the behavior more literally, but no rename has landed.

## It's working if

- Questions arrive in dependency-safe rounds with a recommendation for each one.
- Terms land during the session, at the nearest owner, rather than in one lump at the end.
- The **Ubiquitous Language** remains pure domain vocabulary and excludes implementation detail and spec prose.
- Questions the codebase can answer are answered by reading the codebase, not asked of you.
- You get few or no architectural decisions, and each recorded one would be expensive to re-litigate.
- Child contracts exist only at durable ownership boundaries and appear in the parent's **Child DOX Index**.
- A configured DOX project uses `/dox` for retrieval and structural validation while `domain-modeling` owns semantic changes.

## Where it fits

`grill-with-docs` is the head of the main build chain:

```txt
grill-with-docs → to-spec → to-tickets → implement → mp-code-review
```

It comes before a spec: it produces the shared understanding and settled vocabulary that [to-spec](https://aihero.dev/skills-to-spec) synthesises without interviewing you again. Its close neighbours are [grill-me](https://aihero.dev/skills-grill-me), the same interview with no repository state, and [domain-modeling](https://aihero.dev/skills-domain-modeling), the semantic discipline for canonical DOX records or the unconfigured `AGENTS.md` fallback. Both sit on the [grilling](https://aihero.dev/skills-grilling) primitive. [Wayfinder](https://aihero.dev/skills-wayfinder) charts efforts too large for one session and can hand parts of the map back down to it. When you are unsure which skill or flow fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
