---
name: improve-codebase-architecture
description: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
disable-model-invocation: true
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

This command uses applicable project meaning and a shared design vocabulary:

- Run `/codebase-design` for **module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, and **locality**, plus the deletion test and "the interface is the test surface." Use those terms in every suggestion.
- Use the project's domain language to name seams and its durable decisions to avoid re-litigating settled trade-offs.

## Process

### 1. Scope and explore

Check for `dox.config.json` when choosing the contract route.

- **Configured DOX:** follow the installed `/dox` skill for retrieval eligibility, context reuse, and maintenance as candidate scopes emerge.
- **Unconfigured fallback:** use the applicable root-to-nearest `AGENTS.md` chain and any relevant co-located `DECISIONS.md` entries it indexes. Read that context for each candidate area before inspecting its source.

Then decide where to look. Deepening pays when future changes become easier, so bias toward active code:

- If the user named a module, subsystem, or pain point, use it.
- Otherwise, inspect a useful stretch of `git log --oneline` for recurring files and areas. If changes are scattered, widen the scan.

Spawn an exploration subagent using the harness's available mechanism to walk the selected code. Explore organically and note friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates as an HTML report

Write a self-contained HTML file to the OS temp directory so nothing lands in the repo. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (or `%TEMP%` on Windows), and write to `<tmpdir>/architecture-review-<timestamp>.html` so each run gets a fresh file. Open it for the user — `xdg-open <path>` on Linux, `open <path>` on macOS, `start <path>` on Windows — and tell them the absolute path.

The report uses **Tailwind via CDN** for layout and styling, and **Mermaid via CDN** for diagrams where a graph/flow/sequence reliably communicates the structure. Mix Mermaid with hand-crafted CSS/SVG visuals — use Mermaid when relationships are graph-shaped (call graphs, dependencies, sequences), and hand-built divs/SVG when you want something more editorial (mass diagrams, cross-sections, collapse animations). Each candidate gets a **before/after visualisation**. Be visual.

For each candidate, render a card with:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture is causing friction
- **Solution** — plain English description of what would change
- **Benefits** — explained in terms of locality and leverage, and how tests would improve
- **Before / After diagram** — side-by-side, custom-drawn, illustrating the shallowness and the deepening
- **Recommendation strength** — one of `Strong`, `Worth exploring`, `Speculative`, rendered as a badge

End the report with a **Top recommendation** section: which candidate you'd tackle first and why.

Use the applicable project's domain language and the `/codebase-design` vocabulary. If the project contract defines "Order," write "the Order intake module," not "the FooBarHandler" or "the Order service."

**Decision conflicts:** surface a conflict only when the friction justifies reopening the decision. Cite its DOX record ID or fallback ADR number in the card and explain why it may be worth revisiting.

See [HTML-REPORT.md](HTML-REPORT.md) for the full HTML scaffold, diagram patterns, and styling guidance.

Do NOT propose interfaces yet. After the file is written, ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, run the `/grilling` skill to walk the decision tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

As decisions crystallize, run `/domain-modeling` to keep the selected contract store current:

- **A deepened module uses a missing domain concept:** record the canonical term in its owning DOX record when configured, or the nearest owning `AGENTS.md` fallback otherwise.
- **A fuzzy term becomes precise:** update that same selected store immediately, following the installed `/dox` skill's maintenance policy when configured.
- **The user rejects a candidate for a durable reason:** offer a decision in the selected store so later surveys do not repeat it. Skip temporary reasons such as "not worth it right now".
- **Alternative interfaces need exploration:** run `/codebase-design` and use its design-it-twice pattern.
