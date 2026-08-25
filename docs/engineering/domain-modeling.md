## What it does

`domain-modeling` builds and sharpens a project's **ubiquitous language** while you are designing: it challenges terms that conflict with the inherited model, forces precise words where vague ones hide distinctions, and stress-tests relationships with concrete scenarios until the boundaries are exact.

It is the **active** discipline, not the passive one. Reading the applicable root-to-nearest `AGENTS.md` chain to borrow its vocabulary is a normal codebase habit. This skill is for changing the model. It records a resolved term in the nearest owning document when it resolves, not as a tidy summary at the end. In a repository with `dox.config.json`, `/dox` resolves the applicable structured records and `domain-modeling` still owns the semantic update.

## When to reach for it

Type `/domain-modeling`, or the agent reaches for it automatically when a task fits. In practice, automatic invocation is the weakest part of the skill: when `grill-with-docs` or `wayfinder` says to load it, [models](https://www.aihero.dev/ai-coding-dictionary/model) can load `grilling` and skip this one. If a [grilling](https://www.aihero.dev/ai-coding-dictionary/grilling) session ends without the applicable domain contract changing, invoke it by name alongside the other skill.

Reach for it when the *words* are the problem:

| The situation | The move |
| --- | --- |
| Two people mean different things by "cancellation" | `domain-modeling` — pick the canonical term and record the rejected synonym |
| "Account" is doing three jobs in three files | `domain-modeling` — split it into Customer and User |
| You made a hard-to-reverse architectural choice | `domain-modeling` — offer a globally numbered decision if the choice clears the bar |
| The module's *shape* is the problem, such as where the seam goes or how deep the interface is | [codebase-design](https://aihero.dev/skills-codebase-design) |
| You want the whole plan interrogated before you build | [grill-with-docs](https://aihero.dev/skills-grill-with-docs), which drives this skill underneath |
| You want existing contract records retrieved or structurally validated | [dox](https://aihero.dev/skills-dox) in a configured DOX project; otherwise read the applicable `AGENTS.md` chain |

## Prerequisites

For an `AGENTS.md` contract, start at the repository root and read down to the nearest document that owns the area under discussion. Parent **Ubiquitous Language** and **Architectural Decisions** are inherited unless a child explicitly specializes them. Sections are created lazily, and a child `AGENTS.md` is created only for a durable subtree-specific boundary. Every child must be listed in its parent's **Child DOX Index**.

For a configured DOX project, `dox.config.json` and its configured records must be present. Use [dox](https://aihero.dev/skills-dox) to resolve the applicable records before adjudicating a change and to validate their structure afterwards.

## Two kinds of contract knowledge, two bars

Terms and architectural decisions are held to different standards, and conflating them is where most trouble starts.

| | Ubiquitous Language | Architectural Decision |
| --- | --- | --- |
| Holds | What a domain thing **is**, its relationships, and words to avoid | One hard-to-reverse choice, its reason, and only the non-obvious consequences worth preserving |
| Bar to write | A vague or overloaded term became canonical | **All three**: hard to reverse, surprising without context, and the result of a real trade-off |
| Written | Inline when the term settles, in the nearest owning `AGENTS.md`, or as the appropriate DOX record | Inline in the nearest owning `AGENTS.md` while small; later in its co-located `DECISIONS.md`, with the index retained in `AGENTS.md`; or as a DOX decision record |
| Never holds | Implementation guidance, a [spec](https://www.aihero.dev/ai-coding-dictionary/spec), or scratch notes | A diary of every choice made in the session |

Miss any one of the decision's three tests and there is no record. An easily reversed decision will simply be reversed; an unsurprising one raises no future question; one with no real alternative records that you did the obvious thing.

The Ubiquitous Language rule is the one to hold onto because it is the one that breaks in practice. **It is domain language and nothing else.** Left unchecked, models treat "write to the contract" as permission to persist every answer, and the owning `AGENTS.md` becomes a running spec. When inline Architectural Decisions begin to dominate an owning `AGENTS.md`, graduate their bodies verbatim to a co-located `DECISIONS.md`. Keep the numbered index and always-binding local contracts in `AGENTS.md`.

## Cross-referencing, and where it stops

The move that makes the skill click is checking the code when you state how something works and surfacing the contradiction. *"Your code cancels entire Orders, but you just said partial cancellation is possible. Which is right?"* The language and the code are made to agree out loud before either changes.

The comparison follows ownership. It reads every `AGENTS.md` from the root to the nearest owner, including inherited language and decisions, and checks the code. In a configured DOX project, `/dox` resolves the applicable records instead of broad record-store inspection. It does not search the issue tracker, so a naming collision settled only in a closed issue can look new. Put durable domain guidance in the owning contract rather than relying on issue history.

## Common questions

**My root `AGENTS.md` has become enormous. What do I do?**
First remove implementation detail, session notes, and spec material from **Ubiquitous Language**. Do not solve bloat by creating arbitrary child files. Once the root is lean, move genuinely subtree-specific language and decisions into the nearest child `AGENTS.md` only where a durable ownership boundary exists, and list that child in the parent's **Child DOX Index**. If decision bodies alone dominate one document, graduate them to a co-located `DECISIONS.md` while keeping the numbered index in `AGENTS.md`.

**Why keep the language in `AGENTS.md` instead of a separate glossary?**
Because the root-to-nearest chain is the project's applicable contract. Language, inherited decisions, local contracts, and ownership arrive together for the area being changed. A separate glossary would create another retrieval path and another source that can drift. A configured DOX project is the exception: its structured records are resolved through `/dox`, not mirrored into a parallel glossary.

**Where did `/ubiquitous-language` go?**
Its job moved into `domain-modeling`, which maintains the whole model continuously rather than dumping a glossary out of one conversation. Vocabulary enforcement became more load-bearing: it now runs underneath grilling, triage, and mapping rather than as a separate pass you remember to do.

**How do I establish a domain model for a codebase that has none?**
Ask explicitly: `/grill-with-docs help me scaffold the domain model for this repo`. Expect a long interrogation on a substantial brownfield system. The skill creates useful sections lazily instead of generating empty scaffolding. Most repositories begin with a root-only `AGENTS.md`; child contracts appear only when a durable local boundary justifies one.

**Can I keep the domain model and use my own decision format?**
Yes, within the owning document's **Change Protocol**. Keep global immutable `ADR-NNNN` identifiers and nearest-owner placement, but match the surrounding document's concise shape. Small decision sets stay inline. Mature sets graduate to the co-located `DECISIONS.md`. In a DOX project, decisions are DOX records and no parallel `DECISIONS.md` is kept.

**Does a shared domain language actually earn its keep?**
Sometimes it does not. Domain-driven design pays most at naming and concept boundaries: module names, table names, states, issue titles, and commands. It matters less in ordinary prose. Its clearest value is keeping humans, reviewers, and agents aligned about what the system means. On a one-day build, skip ceremony. An unreviewed, agent-authored domain model is worse than none because later sessions treat confident lore as truth.

**Can it turn vague prompts into domain language for me?**
No. A language you do not understand becomes meaningless once written down. This skill enforces precision as understanding emerges; it does not manufacture vocabulary you do not have. Right nouns over the wrong conceptual structure still produce incorrect output.

## It's working if

- It stops you mid-sentence to ask which of two things you meant instead of picking one.
- The nearest owning contract changes during the conversation, not in a burst at the end.
- A new term appears at the narrowest scope that owns it, and inherited meanings are not copied into children.
- It refuses to record a reversible choice and says which of the three tests failed.
- Decision bodies stay inline while small, then graduate without losing their global numbers or the `AGENTS.md` index.
- In a configured DOX project, `/dox` resolves and validates records while `domain-modeling` decides what their semantics should be.
- It quotes your code back when the code and the stated model disagree.

## Where it fits

`domain-modeling` is a **model-invoked reference** that runs underneath other skills more often than it runs alone. [dox](https://aihero.dev/skills-dox) is its contract-layer neighbour: it retrieves and structurally validates configured records while `domain-modeling` determines their semantics. [grill-with-docs](https://aihero.dev/skills-grill-with-docs) drives it through a grilling session, [wayfinder](https://aihero.dev/skills-wayfinder) loads it while charting a map, [triage](https://aihero.dev/skills-triage) keeps [tickets](https://www.aihero.dev/ai-coding-dictionary/ticket) in the project's language, and [improve-codebase-architecture](https://aihero.dev/skills-improve-codebase-architecture) calls it as decisions crystallise. Its closest sibling is [codebase-design](https://aihero.dev/skills-codebase-design): this skill owns the domain vocabulary, while that one owns the module's shape. When you are unsure which skill fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
