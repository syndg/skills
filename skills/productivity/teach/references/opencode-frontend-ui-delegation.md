# OpenCode delegation for teaching frontend UI

Use this only when originating a **genuinely new UI** for a teaching artifact: a new standalone lesson visual direction, reference-page system, live lab, demo, quiz surface, or interactive explainer.

Do not use this workflow to extend, repair, or restyle an existing UI. If the workspace has a `DESIGN.md`, `lessons/_TEMPLATE.html`, or an established asset/component system, that locked workspace design **overrides this reference**. Inspect and reuse the existing system.

## Rule

For a SynDG-facing teaching UI that meets the preconditions above, OpenCode originates the new visual design. Hermes teaches, coordinates, verifies, and patches objective defects.

Default model:

```bash
$HOME/.bun/bin/bunx opencode-ai@latest run \
  'Read prompt.md and create the requested standalone artifact. Do not inspect or reuse existing project HTML/CSS.' \
  --model opencode-go/glm-5.2 \
  --agent build \
  -f /tmp/<clean-workspace>/prompt.md
```

## Prompt shape

Give OpenCode only:

- audience and learning objective
- required lesson content / teaching meat
- required interactions
- accessibility constraints
- technical constraints: standalone/static, inline CSS/JS if appropriate, no external deps if requested
- anti-references: generic AI lesson pages, glassmorphism, huge hero, repeated card grids, cramped code/diagrams
- exact output path

Use a clean workspace and do not attach existing lesson HTML/CSS or screenshots when the task truly calls for a fresh design. If the user asks for a modification, or existing workspace UI must be preserved, this delegation workflow does not apply; work from the locked design instead.

## Verification after generation

Hermes must verify before publishing:

1. File exists and HTML parses.
2. Copy to canonical project/publish path only after generation completes.
3. Public URL returns HTTP 200 when publishing.
4. Browser renders the exact public URL.
5. No page-level horizontal overflow.
6. Quiz/interaction works after any delayed aria-live updates.
7. Visual QA: hero/footer not oversized, code/table columns not cramped, body text readable.
8. Patch only objective defects or missing requirements. Do not replace OpenCode’s visual direction unless the user asks.

## Known objective defects to watch for

- Comparison tables with a too-narrow label column on desktop; prefer `grid-template-columns:minmax(220px,.72fr) 1fr` or stack on mobile.
- Hidden feedback/status panels that CSS accidentally displays before interaction.
- `aria-live` feedback that updates after a short timeout; verify after a delay, not only immediately after click.
- Mobile code/type signatures forcing page-level overflow; confine scroll to the code block or wrap intentionally.
