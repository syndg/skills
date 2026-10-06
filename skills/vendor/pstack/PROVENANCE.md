# pstack provenance

Vendored pass 1 of pstack, a plugin by Lauren Tan (MIT, see [LICENSE.txt](./LICENSE.txt)).

- Source repo: `~/work/cursor-plugins` (upstream `https://github.com/cursor/plugins`, directory `pstack/`)
- Source commit: `e43c7ee26e0038c6c1fa8380dd34ce86ff94cb2a` (`refactor(pstack): use bare performance mantras in perf-issue step 2 (#496)`)
- pstack plugin version at that commit: `0.15.9`
- Files were read with `git show e43c7ee:<path>`, not from the working tree.

Not vendored in this pass: correct, recall, orchestrate, `orch.ts`.

## Vendoring rules applied

- Model names come out and roles go in: "a reviewer model like X" becomes "`ray role reviewer`".
- Everything else is verbatim, except the edits listed per piece below.

## Pieces

All source paths are relative to `pstack/skills/` at the source commit.

### create-verification-skill/

Verbatim copy, no edits.

| Vendored | Source |
| --- | --- |
| `create-verification-skill/SKILL.md` | `create-verification-skill/SKILL.md` |
| `create-verification-skill/references/feature-map-example/README.md` | `create-verification-skill/references/feature-map-example/README.md` |
| `create-verification-skill/references/feature-map-example/create-note.md` | `create-verification-skill/references/feature-map-example/create-note.md` |
| `create-verification-skill/references/feature-map-example/search.md` | `create-verification-skill/references/feature-map-example/search.md` |

### maintain-verification-skill/

Verbatim copy, no edits.

| Vendored | Source |
| --- | --- |
| `maintain-verification-skill/SKILL.md` | `maintain-verification-skill/SKILL.md` |

### show-me-your-work/

| Vendored | Source |
| --- | --- |
| `show-me-your-work/SKILL.md` | `show-me-your-work/SKILL.md` |
| `show-me-your-work/scripts/log.sh` | `show-me-your-work/scripts/log.sh` |
| `show-me-your-work/references/decision-log-template.tsv` | `show-me-your-work/references/decision-log-template.tsv` |

Edits to `SKILL.md`, all in "Cross-model review of the trail":

- "spawn a subagent on a different model family from the one that did the work" became "spawn a subagent with `ray role reviewer`".
- "Lead with the reviewer's model on its own line (`reviewed by <model>`)" became "Lead with the reviewer's role on its own line (`reviewed by ray role reviewer`)".
- "The model name is not." became "The reviewer line is not."

### ship/

One skill merged from two poteto-mode playbooks plus the watcher CLI. The new frontmatter, the title, the two-part intro and the two `##` part headings are written for this vendor and have no source. Each playbook's own `###` title line and its blank line were dropped.

| Vendored | Source |
| --- | --- |
| `ship/SKILL.md` lines 1-9 | new (frontmatter, title, intro) |
| `ship/SKILL.md` line 11 | new heading `## Part 1: Babysit` |
| `ship/SKILL.md` lines 13-37 | `poteto-mode/playbooks/babysit.md` lines 3-27 |
| `ship/SKILL.md` line 39 | new heading `## Part 2: Shipping` |
| `ship/SKILL.md` lines 41-55 | `poteto-mode/playbooks/shipping.md` lines 3-17 |
| `ship/scripts/watch-pr/{cli,github,policy,render,types}.ts`, `watch-pr`, `tsconfig.json` | `poteto-mode/scripts/watch-pr/` (verbatim; tests and fakes not vendored) |
| `ship/scripts/bootstrap.ts`, `package.json`, `bun.lock` | `poteto-mode/scripts/` (verbatim; installs `commander` on first run) |
| `ship/scripts/.gitignore` | new (`node_modules/`) |
| `ship/references/bugbot-triage.md` | `poteto-mode/references/bugbot-triage.md` (verbatim) |

Edits inside the copied playbook lines (cross-references only, since the playbook files do not exist here):

- `playbooks/shipping.md` became "Part 2 (Shipping)" (babysit.md lines 3, 18, 25).
- `playbooks/babysit.md` became "Part 1 (Babysit)" (shipping.md line 5).
- "Route that request to Shipping." (babysit.md line 23) became "Route that request to Part 2 (Shipping)."

Known dangling references, left verbatim:

- `playbooks/autopilot-full.md` (babysit step 4) is not vendored.
- Cursor-specific wording ("Cursor cloud agent", `cursor-team-kit` control skills, "Cursor's built-in babysit skill", `origin pr ...`) is kept verbatim because it names no model.
