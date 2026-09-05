## What it does

`domain-modeling` builds and sharpens a project's **ubiquitous language** while you design. It challenges conflicting terms, forces precise words where vague ones hide distinctions, and tests relationships with concrete scenarios.

Configured repositories follow [dox](https://aihero.dev/skills-dox)'s retrieval, reuse, and maintenance policy. `domain-modeling` adjudicates meaning against the delivered standing context and obligations. Only an unconfigured repository uses the root-to-nearest `AGENTS.md` and `DECISIONS.md` fallback. The stores are never combined.

## When to reach for it

Type `/domain-modeling`, or the agent reaches for it automatically when a task fits. In practice, automatic invocation is the weakest part of the skill: when `grill-with-docs` or `wayfinder` says to load it, [models](https://www.aihero.dev/ai-coding-dictionary/model) can load `grilling` and skip this one. If a [grilling](https://www.aihero.dev/ai-coding-dictionary/grilling) session ends without the applicable domain contract changing, invoke it by name alongside the other skill.

Reach for it when the *words* are the problem:

| The situation | The move |
| --- | --- |
| Two people mean different things by "cancellation" | `domain-modeling` — pick the canonical term and record the rejected synonym |
| "Account" is doing three jobs in three files | `domain-modeling` — split it into Customer and User |
| You made a hard-to-reverse architectural choice | `domain-modeling` — offer a durable decision if the choice clears the bar, using DOX when configured and the numbered ADR fallback otherwise |
| The module's *shape* is the problem, such as where the seam goes or how deep the interface is | [codebase-design](https://aihero.dev/skills-codebase-design) |
| You want the whole plan interrogated before you build | [grill-with-docs](https://aihero.dev/skills-grill-with-docs), which drives this skill underneath |
| You want existing contract context retrieved or structurally validated | [dox](https://aihero.dev/skills-dox) in a configured DOX project; otherwise read the applicable `AGENTS.md` chain |

## Prerequisites

Choose storage by one trigger:

| Trigger | Contract path |
| --- | --- |
| `dox.config.json` exists | Follow the installed DOX skill for retrieval, reuse, and canonical-record maintenance; use `domain-modeling` to adjudicate meaning. |
| `dox.config.json` is absent | Read the `AGENTS.md` chain from the repository root to the nearest owner and any relevant co-located `DECISIONS.md` entries it indexes. Parent language and decisions are inherited. Create sections lazily and child documents only for durable ownership. |

## Two kinds of contract knowledge, two bars

Terms and architectural decisions are held to different standards, and conflating them is where most trouble starts.

| | Ubiquitous Language | Architectural Decision |
| --- | --- | --- |
| Holds | What a domain thing **is**, its relationships, and words to avoid | One hard-to-reverse choice, its reason, and only the non-obvious consequences worth preserving |
| Bar to write | A vague or overloaded term became canonical | **All three**: hard to reverse, surprising without context, and the result of a real trade-off |
| Written | Existing canonical DOX record, or a new configured record for a confirmed gap; otherwise inline in the nearest fallback `AGENTS.md` | Canonical DOX decision record when configured; otherwise inline in the nearest fallback `AGENTS.md`, with co-located `DECISIONS.md` only after the section grows large |
| Never holds | Implementation guidance, a [spec](https://www.aihero.dev/ai-coding-dictionary/spec), or scratch notes | A diary of every choice made in the session |

Miss any one of the decision's three tests and there is no ADR. That does not discard other durable meaning: in configured DOX, a settled domain boundary or behavioral contract can belong in standing context without a historical rationale record.

The Ubiquitous Language rule is easy to break. Keep vocabulary records focused on domain language. Configured DOX separates standing meaning, binding obligations, and optional ADR rationale under its maintenance policy. In the unconfigured fallback, keep specs and session notes out of `AGENTS.md`; graduate large decision bodies to co-located `DECISIONS.md` while retaining their numbered index.

## Cross-referencing, and where it stops

The move that makes the skill click is checking the code when you state how something works and surfacing the contradiction. *"Your code cancels entire Orders, but you just said partial cancellation is possible. Which is right?"* The language and the code are made to agree out loud before either changes.

The comparison follows the selected store. Configured DOX supplies applicable meaning through its installed skill rather than broad record-store inspection. Without it, read each fallback `AGENTS.md` from root to nearest owner. The skill does not search the issue tracker, so durable guidance belongs in the canonical contract rather than issue history.

## Common questions

**My root `AGENTS.md` has become enormous. What do I do?**
This question applies only to the unconfigured fallback. Remove implementation detail, session notes, and spec material from **Ubiquitous Language**. Move genuinely subtree-specific material to child `AGENTS.md` files only at durable ownership boundaries. If decision bodies dominate one owner, move them to a co-located `DECISIONS.md` and retain the numbered index.

**Why keep fallback language in `AGENTS.md` instead of a separate glossary?**
Without `dox.config.json`, the root-to-nearest chain is the applicable fallback contract, so a separate glossary would add a retrieval path that can drift. With the config present, canonical DOX records replace that fallback rather than being mirrored into it.

**Where did `/ubiquitous-language` go?**
Its job moved into `domain-modeling`, which maintains the whole model continuously rather than dumping a glossary out of one conversation. Vocabulary enforcement became more load-bearing: it now runs underneath grilling, triage, and mapping rather than as a separate pass you remember to do.

**How do I establish a domain model for a codebase that has none?**
First check for `dox.config.json`. In a configured repository, add or edit records only through the explicit DOX workflow; setup never initializes DOX for you. Without the config, `/grill-with-docs help me scaffold the domain model for this repo` creates useful fallback sections lazily, usually beginning with one root `AGENTS.md`.

**Can I keep the domain model and use my own decision format?**
In configured DOX, follow the configured record schema and keep no parallel `DECISIONS.md`. In the unconfigured fallback, match the owner's **Change Protocol**, retain global immutable `ADR-NNNN` identifiers, and graduate mature decision bodies to co-located `DECISIONS.md`.

**Does a shared domain language actually earn its keep?**
Sometimes it does not. Domain-driven design pays most at naming and concept boundaries: module names, table names, states, issue titles, and commands. It matters less in ordinary prose. Its clearest value is keeping humans, reviewers, and agents aligned about what the system means. On a one-day build, skip ceremony. An unreviewed, agent-authored domain model is worse than none because later sessions treat confident lore as truth.

**Can it turn vague prompts into domain language for me?**
No. A language you do not understand becomes meaningless once written down. This skill enforces precision as understanding emerges; it does not manufacture vocabulary you do not have. Right nouns over the wrong conceptual structure still produce incorrect output.

## It's working if

- It stops you mid-sentence to ask which of two things you meant instead of picking one.
- The selected owning contract changes during the conversation, not in a burst at the end.
- A new term appears in one canonical DOX record or at the narrowest fallback scope, never both.
- It refuses an ADR for a reversible choice without discarding other settled durable meaning.
- Fallback decision bodies graduate without losing their global number or `AGENTS.md` index.
- Configured DOX supplies standing meaning and applicable obligations for adjudication, and semantic edits follow its maintenance policy.
- It quotes your code back when the code and the stated model disagree.

## Where it fits

`domain-modeling` is a **model-invoked reference** that runs underneath other skills more often than it runs alone. [dox](https://aihero.dev/skills-dox) owns configured retrieval, reuse, and maintenance while `domain-modeling` adjudicates semantics. [grill-with-docs](https://aihero.dev/skills-grill-with-docs) drives it through a grilling session, [wayfinder](https://aihero.dev/skills-wayfinder) loads it while charting a map, [triage](https://aihero.dev/skills-triage) keeps [tickets](https://www.aihero.dev/ai-coding-dictionary/ticket) in the project's language, and [improve-codebase-architecture](https://aihero.dev/skills-improve-codebase-architecture) calls it as decisions crystallise. Its closest sibling is [codebase-design](https://aihero.dev/skills-codebase-design): this skill owns domain vocabulary, while that one owns module shape. When you are unsure which skill fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
