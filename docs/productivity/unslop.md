## What it does

`unslop` removes common AI tells from prose and restores a specific human voice. It cuts filler, puffery, vague claims, canned transitions, decorative formatting, abstract jargon, and sentences that sound polished without saying anything.

Its defining constraint is that meaning, evidence, and project language come first. It preserves exact symbols, facts, quotations, and the Ubiquitous Language from compact DOX items when `dox.config.json` exists, or from the applicable root-to-nearest `AGENTS.md` chain only in the unconfigured fallback. The pattern catalog is a set of editing heuristics, not a reason to replace a precise term.

## When to reach for it

Type `/unslop`, or the [agent](https://www.aihero.dev/ai-coding-dictionary/agent) reaches for it automatically whenever it writes or edits prose. That includes docs, READMEs, specs, plans, issue text, PR descriptions, commit messages, emails, and agent replies.

Reach for it directly when text feels generic, padded, promotional, formulaic, too tidy, or suspiciously detached from concrete facts. Give it the target and any voice constraint that matters, such as `/unslop this README but keep the author's dry tone`.

## Prerequisites

If the repository defines a Ubiquitous Language, load it before replacing words from the pattern catalog. Read the applicable `AGENTS.md` chain in an unconfigured project; in a configured DOX project, use the compact items returned by `dox resolve`. No runtime or external service is required.

## The editing pass

The pass has four moves:

1. Find the cataloged patterns.
2. Rewrite without changing meaning or evidence.
3. Add a real point of view, varied rhythm, and concrete detail.
4. Ask what still makes the result look machine-made, then fix it.

The catalog covers content, language, formatting, chatbot artifacts, filler, jargon, and plain speech. It is deliberately strict about em dashes, mid-sentence colons, forced groups of three, synonym cycling, vague attribution, abstract metaphors, and claims that describe a feeling instead of a mechanism.

## Common questions

**Does it ban every word in the catalog?**

No. A word can be correct because the code, domain contract, or quoted source uses it precisely. The skill removes abstract stand-ins and habitual phrasing. It does not rename the project's language.

**How is this different from writing-for-agents?**

[writing-for-agents](https://aihero.dev/skills-writing-for-agents) designs documents that agents can retrieve and follow. It handles structure, disclosure, leading words, and pruning. `unslop` is the prose cleanup pass that applies to agent-facing documents and ordinary human-facing writing.

**Does it edit code too?**

No. It applies to prose, including comments and user-facing strings when the surrounding task permits those edits. It does not change code structure or remove defensive code.

**Why does it reject em dashes entirely?**

The rule is intentionally stricter than a normal style guide. Repeated long dashes are a strong AI tell, and swapping them for parentheses or fake dashes keeps the same sentence habit. The skill splits the thought or uses a comma instead. It does not require a retroactive repository-wide punctuation rewrite.

**Will it rewrite quotations or citations?**

No. Evidence wins over style. Leave quoted text intact unless the author has permission to paraphrase it, and never smooth a claim by changing what the source says.

## It's working if

- The result sounds like one person with a point of view, not a neutral template.
- Every claim names a fact, source, mechanism, instruction, or measured result.
- Project terms and code symbols stay exact.
- Filler and canned chatbot phrases disappear without making the prose terse or sterile.
- Sentence rhythm varies, but dense sentences no longer make the reader backtrack.
- The edited text preserves the original meaning and evidence.

## Where it fits

`unslop` is a **model-invoked prose layer** beneath every workflow that produces writing. Its closest neighbor is [writing-for-agents](https://aihero.dev/skills-writing-for-agents), which owns document design. [wait-what](https://aihero.dev/skills-wait-what) repairs one message that failed to land. `unslop` prevents the common prose tells before the reader sees them. [ask-matt](https://aihero.dev/skills-ask-matt) routes across the larger set when the problem is not only the writing.
