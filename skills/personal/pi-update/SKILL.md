---
name: pi-update
description: Update the user's maintained Syn Pi fork by merging official upstream Pi into the fork's default `syn-pi` branch, preserve the focused context-management and jump-to-bottom patch stack, validate it, build the internal CLI, and keep official `pi` separate from `syn-pi`. Use whenever the user says "update Pi", "update Syn Pi", "sync my Pi fork", "pull Pi upstream", "merge Pi upstream", "rebase Pi", or asks to rebuild their personalized Pi against current upstream changes. Do not use for updating Pi extensions, skills, themes, or an unrelated repository.
---

# Pi Update

Maintain Syn Pi as a small downstream patch stack on the personal fork's default `syn-pi` branch. Official Pi owns fullscreen rendering; Syn Pi adds context-management behavior and the clickable jump-to-bottom control only. Bring upstream updates into `syn-pi` with merge-based, non-rewriting integration so the default branch can be pushed normally without force.

## Repository identity

- Working repository: `/Users/syndg/Coding/syn-pi`
- Official upstream: `git@github.com:earendil-works/pi.git` (`upstream`)
- Personal fork: `git@github.com:syndg/pi.git` (`origin`)
- Maintained local branch: `syn-pi`
- Personal fork default branch: `origin/syn-pi`
- Official integration source: `upstream/main`
- Built CLI: `packages/coding-agent/dist/cli.js`
- Official command wrapper: `~/.local/bin/pi`
- Personalized command wrapper: `~/.local/bin/syn-pi`
- Official compatibility wrapper: `~/.local/bin/pi-stock`

The working repository and personalized launcher must remain on the laptop's internal storage. Do not make the active Syn Pi build depend on `/Volumes/External`. `pi` must continue to launch the official global installation; only `syn-pi` launches the local fork. Identify remotes by URL before relying on their names, and do not use the obsolete local `main` branch as the maintained fork branch.

## Maintained downstream behavior

Preserve only:

- Percentage-based proactive compaction (`compaction.thresholdPercent`).
- Independent overflow/length-stop recovery (`compaction.overflowRecovery`).
- Complete model-visible context estimates, including system prompt and active tool schemas.
- Request-boundary compaction before provider calls that follow tools or queued messages.
- Durable compaction summaries, file-operation tracking, extension-result validation, and usage provenance.
- Model, thinking, request-hook, retry, steering, and queue state across compaction/retry continuations.
- The optional clickable jump-to-bottom control in `TuiAltScreen`, enabled by coding-agent fullscreen mode.

Do not restore the retired custom fullscreen implementation. In particular, do not reintroduce:

- A downstream fullscreen renderer or alternate-screen lifecycle.
- Live fullscreen mouse opt-out or `terminal.fullscreenMouse`.
- Legacy `terminal.screenMode` or `terminal.fullscreenScrollbar` compatibility.
- Downstream terminal startup/shutdown cleanup overrides.
- Downstream scrollbar, selection, image, or mouse-routing behavior already owned by upstream.

When upstream changes fullscreen code, take upstream behavior as authoritative and reapply only the minimal jump-to-bottom option, rendering, hit testing, wiring, documentation, and focused tests.

## Safety contract

Keep the last verified Syn Pi build recoverable throughout the update.

- Inspect branch, worktrees, remotes, status, launcher targets, and recent commits first.
- Stop if tracked or untracked work could be overwritten. Never silently stash, discard, reset, clean, or remove it.
- Confirm local `syn-pi`, `origin/syn-pi`, and their divergence before integration. Stop on unexplained divergence.
- Create a timestamped `backup/syn-pi-*` ref at the verified local `syn-pi` SHA before integrating.
- Integrate in a temporary `candidate/syn-pi-*` branch or worktree based on the verified `syn-pi`; do not move the maintained branch before validation passes.
- Never force-push or rewrite `origin/syn-pi`. If a candidate is not a descendant of `origin/syn-pi`, stop and report it instead of pushing.
- A normal request to update or sync Syn Pi authorizes pushing the validated non-force update to `origin/syn-pi`, unless the user explicitly requests local-only work.
- Never repoint `~/.local/bin/pi` to the fork. Keep the official launcher and rollback refs available.

## Update workflow

1. **Inspect**
   - Before repository research, check for `dox.config.json`. If it exists, run `dox resolve` for the Syn Pi upstream update with the known affected paths and use the compact items in its resolution envelope; do not substitute `AGENTS.md` or `DECISIONS.md` contract prose. If it is absent, read the applicable root-to-nearest `AGENTS.md` chain and any relevant co-located `DECISIONS.md` entries it indexes as the repository contract. In both branches, read `CONTRIBUTING.md` for workflow instructions.
   - Confirm `/Users/syndg/Coding/syn-pi` is independent of external-volume Git object stores or worktree metadata.
   - Verify official and personal remotes by URL; refresh `origin/HEAD` if needed and confirm the personal fork's default is `origin/syn-pi`.
   - Record local `syn-pi`, `origin/syn-pi`, `upstream/main`, their merge-bases/divergence, downstream commits, status, and launcher targets.
   - Fast-forward local `syn-pi` from `origin/syn-pi` only when that is clean and unambiguous. Stop rather than inventing a reconciliation for divergent unpublished work.

2. **Fetch and summarize**
   - Fetch `upstream` and `origin` without changing local files.
   - Summarize the incoming `upstream/main` range and likely conflicts in agent-loop, compaction, settings, interactive mode, and alternate-screen TUI files.

3. **Prepare a non-rewriting candidate**
   - Create a timestamped backup ref for the verified local `syn-pi` SHA.
   - Create `candidate/syn-pi-*` from the verified, up-to-date `syn-pi` branch.
   - Merge latest `upstream/main` into the candidate. Preserve ancestry from `origin/syn-pi`; the normal update path must remain pushable without force.
   - Do not rebase or rebuild `syn-pi` directly from upstream. If upstream changes make selective replay or history replacement genuinely necessary, stop and propose a separate migration branch rather than rewriting the default branch.

4. **Resolve semantically**
   - Use the `resolving-merge-conflicts` skill for nontrivial conflicts.
   - Preserve upstream fullscreen behavior and remove obsolete downstream fullscreen hunks rather than reconciling them.
   - Preserve context-management invariants across request hooks, effective models, retries, late steering, and queue modes.
   - Never resolve by blindly choosing all of ours or theirs.

5. **Install and validate**
   - Follow the repository contract and `CONTRIBUTING.md` instructions loaded during inspection. If DOX is configured, rerun resolution with newly known changed paths before editing them; otherwise read any applicable child `AGENTS.md` for those paths.
   - Hydrate generated model/provider data when required.
   - Run modified focused tests first: agent loop, compaction/settings regressions, `tui-alt-screen`, and interactive TUI wiring.
   - Run `npm run check`.
   - Run `./test.sh` for the full update workflow.
   - Build with the repository's offline build command when available, then smoke-test CLI help/version and fullscreen startup/shutdown in tmux.
   - Run `git diff --check` and inspect `upstream/main...HEAD`. Confirm no retired fullscreen implementation remains.
   - Confirm the candidate is a descendant of `origin/syn-pi` with `git merge-base --is-ancestor origin/syn-pi <candidate>`.

6. **Promote and push only when green**
   - Fast-forward local `syn-pi` to the validated candidate; do not replace it with unrelated history.
   - Keep `~/.local/bin/pi` pointed at the official global installation.
   - Keep `~/.local/bin/syn-pi` pointed at `/Users/syndg/Coding/syn-pi/packages/coding-agent/dist/cli.js`.
   - Keep `~/.local/bin/pi-stock` pointed at the official global installation.
   - Push local `syn-pi` to `origin/syn-pi` with an ordinary non-force push for normal update/sync requests. Stop if the push is not fast-forward.

7. **Preserve rollback paths**
   - Keep timestamped backup refs and unrelated historical candidate worktrees unless the user explicitly asks to remove them.
   - Do not recreate active dependencies on retired external fullscreen checkouts.

## Failure behavior

If fetch, merge, tests, build, smoke validation, ancestry verification, or push fails, keep the verified executable and official `pi` launcher available. Report the failing command, candidate branch/path, and safest next action. Do not paper over an upstream incompatibility or rewrite the default branch.

## Completion report

Keep the final report compact:

- Upstream range merged into `syn-pi`.
- Context-management and jump-to-bottom behavior preserved.
- Retired fullscreen behavior confirmed absent.
- Checks, tests, build, and smoke-test status.
- Official `pi` and personalized `syn-pi` launcher targets.
- `origin/syn-pi` push status and resulting SHA.
- Backup or rollback refs retained.
