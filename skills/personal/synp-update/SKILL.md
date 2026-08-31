---
name: synp-update
description: Update the user's maintained Synp fork by merging upstream Oh My Pi into the fork's default `main` branch, preserve the custom fullscreen TUI and smooth scrolling patch stack, validate it, rebuild the local binary, keep official `omp` separate, and retain the `synp` command name. Use whenever the user says "update Synp", "sync my Synp fork", "pull Oh My Pi upstream", "merge OMP upstream", "update my OMP fork", or asks to rebuild Synp against current upstream changes. Do not use for the separate Syn Pi repository, the `pi-update` workflow, skills, extensions, themes, or the official global `omp` installation.
---

# Synp Update

Maintain Synp as a downstream fullscreen patch stack on Oh My Pi. Bring upstream updates into the fork's `main` branch with a merge commit. Preserve ancestry so the personal fork accepts an ordinary push.

## Repository identity

- Working repository: `/Users/syndg/Coding/syn-p`
- Official upstream: `git@github.com:can1357/oh-my-pi.git` (`upstream`)
- Personal fork: `git@github.com:syndg/syn-p.git` (`origin`)
- Maintained local branch: `main`
- Personal fork default branch: `origin/main`
- Official integration source: `upstream/main`
- Built binary: `/Users/syndg/Coding/syn-p/packages/coding-agent/dist/omp`
- Official command: `/Users/syndg/.bun/bin/omp`
- Personalized launcher: `/Users/syndg/.local/bin/synp`

The repository path remains `syn-p`; the command is `synp`. Keep `syn-p` absent from `PATH`. The `synp` launcher must execute the local built binary with fullscreen mode enabled, while `omp` continues to resolve to the official global installation. Keep the active repository, binary, and launcher on the laptop's internal storage.

## Maintained downstream behavior

Preserve the fullscreen contract, not stale line-level patches.

- `--tui-mode regular|fullscreen` and the `tui.mode` setting.
- Fullscreen settings for scrollbar visibility, copy-on-select, and exit output.
- A fixed composer dock with an application-owned, scrollable transcript.
- One-cell content insets, a reserved scrollbar column, and omission clipping without synthetic right-edge ellipses.
- Mouse-wheel and configurable keyboard scrolling, jump-to-bottom, mouse selection, clipboard copy, and OSC 8 link activation.
- Correct selection coordinates, resize behavior, startup handoff, history flush, and fullscreen exit output.
- Differential alternate-screen painting with safe full-repaint fallbacks for forced frames, geometry changes, images, and OSC 66 rows.
- Fullscreen shell handoff balances the alternate- and main-screen keyboard enhancement stacks before releasing raw input, so vi-mode shells resume in insert mode.
- One-row wheel granularity and latency-sensitive 60 fps scheduling.
- A stable interactive frame deadline under continuous trackpad input. Later reports coalesce into the pending frame instead of postponing it.
- Slow-scroll isolation: the jump-to-bottom control occupies a dedicated fixed row outside the transcript. Unchanged fixed rows normally emit no repaint bytes; the control row explicitly clears and repaints while a background-styled transcript row enters, occupies, or leaves its neighbor. Isolated one-row reports use synchronized logical repaint, coalesced movement uses bounded terminal scrolling, clamped input at either boundary emits no hint or render, and horizontal SGR wheel reports (`66`/`67`) never change the vertical offset. Only overlay transitions explicitly erase other vacated rows.
- The default status line shows Codex weekly quota remaining at the bottom right only while an `openai-codex` model with weekly usage data is active.
- Focused behavioral coverage using the real Kitty VT test engine.
- The `synp` launcher name. Do not recreate a `syn-p` compatibility alias.

Current conflict hot spots include `packages/tui/src/tui.ts`, fullscreen frame-plan and scheduler tests, coding-agent composer and startup code, settings and keybindings, CLI flag handling, documentation, and `packages/coding-agent/src/modes/fullscreen-composer.ts`. Treat this list as a search starting point. The maintained behavior above is authoritative.

If upstream gains overlapping fullscreen support, use upstream code where it satisfies the contract. Remove redundant downstream code only after focused behavioral tests prove parity. Keep the smallest remaining Synp patch rather than carrying two implementations.

## Safety contract

Keep the last verified Synp binary recoverable throughout the update.

- Inspect branch, worktrees, remotes, status, launcher targets, and recent commits before fetching or editing.
- Stop when tracked or untracked work could be overwritten. Never stash, discard, reset, clean, or delete user work to make the update proceed.
- Confirm local `main`, `origin/main`, and their divergence. Stop on unexplained divergence.
- Create a timestamped `backup/synp-*` ref at the verified local `main` SHA before integration.
- Merge in a temporary `candidate/synp-*` branch or worktree based on verified `main`. Do not move `main` until validation passes.
- Preserve ancestry from `origin/main`. Never force-push or rewrite the fork's default branch.
- A normal update or sync request authorizes a validated non-force push to `origin/main`, unless the user requests local-only work.
- Keep `/Users/syndg/.bun/bin/omp` untouched and keep the previously verified `synp` binary available until promotion.

## Update workflow

### 1. Inspect

- Check for `dox.config.json`. If present, run the `/dox` skill for one upstream-update task and all known affected paths. Use its compact resolved items. If absent, use the applicable root-to-nearest `AGENTS.md` chain and any indexed co-located `DECISIONS.md`. Read `CONTRIBUTING.md` when present.
- Verify remotes by URL before relying on their names.
- Record local `main`, `origin/main`, `upstream/main`, merge bases, divergence, downstream commits, worktrees, status, and launcher targets.
- Confirm `synp` points at the local built binary and `omp` points at the official installation.
- Fast-forward local `main` from `origin/main` only when the repository is clean and the relationship is unambiguous.

Inspection is complete when every local change and branch divergence has an owner and the verified rollback SHA is known.

### 2. Fetch and summarize

- Fetch `origin` and `upstream` without changing the worktree.
- Summarize the incoming `upstream/main` range.
- Compare incoming changes against the fullscreen contract and current conflict hot spots.

This step is complete when every likely semantic conflict has a named downstream invariant.

### 3. Prepare a candidate

- Create `backup/synp-<timestamp>` at the verified local `main` SHA.
- Create `candidate/synp-<timestamp>` from that SHA, preferably in a temporary worktree.
- Merge `upstream/main` into the candidate. Keep the merge ancestry intact.
- If the candidate is not a descendant of `origin/main`, stop. Do not repair this with a rebase or force push.

### 4. Resolve semantically

- Run the `/resolving-merge-conflicts` skill for nontrivial conflicts.
- Start from upstream behavior outside the maintained fullscreen contract.
- Preserve the contract through the narrowest coherent implementation.
- When upstream refactors an affected module, port the behavior into the new ownership boundary instead of reviving obsolete files or parallel paths.
- Reject all-ours and all-theirs conflict resolution unless each conflicted hunk was independently checked.

Resolution is complete when every contract item has an implementation owner and no duplicate fullscreen architecture remains.

### 5. Validate the candidate

Run focused checks first.

From `packages/tui`:

```sh
bun run check:types
bun test test/history-frame-plan.test.ts test/adaptive-render-backpressure.test.ts test/input-render-scheduling.test.ts
```

From `packages/coding-agent`:

```sh
bun run check:types
bun test test/fullscreen-composer.test.ts test/welcome-history-resize.test.ts test/cli-tui-mode-flag.test.ts test/startup-composer.test.ts test/issue-9597-cold-launch-double-clear.test.ts
bun run build
```

Then run the repository checks required by the incoming range. For a normal upstream update, include:

```sh
bun run check:ts
bun run test:ts
```

Smoke the built product, not only test files.

- Run `synp --version` and `synp --help`.
- Launch `synp`, produce a transcript longer than the viewport, and exercise fast wheel scrolling, slow one-row scrolling, inertial tail movement in both directions, jump-to-bottom, and clean exit.
- Confirm `which synp` resolves to `/Users/syndg/.local/bin/synp`.
- Confirm `which omp` still resolves to `/Users/syndg/.bun/bin/omp`.
- Confirm `syn-p` does not resolve as a command.
- Run `git diff --check` and inspect `upstream/main...HEAD` for accidental upstream reversions or unrelated files.
- Confirm `git merge-base --is-ancestor origin/main <candidate>` succeeds.

Validation is complete only when the changed behavior, repository checks, built binary, launcher separation, and ancestry are all green.

### 6. Promote and push

- Fast-forward local `main` to the validated candidate.
- Keep `synp` pointed at the rebuilt local binary and keep `omp` untouched.
- Push `main` to `origin/main` with an ordinary non-force push unless the user requested local-only work.
- Stop if the push is not fast-forward.

### 7. Preserve rollback

Keep the timestamped backup ref and the last verified binary. Leave unrelated candidate worktrees and historical rollback refs in place unless the user asks to remove them.

## Failure behavior

If fetch, merge, conflict resolution, checks, tests, build, smoke testing, launcher verification, ancestry verification, or push fails, leave local `main`, `origin/main`, `omp`, and the verified `synp` binary unchanged. Report the failing command, candidate branch or worktree, rollback ref, and the smallest safe next action. Do not hide an upstream incompatibility behind a skipped check or rewritten history.

## Completion report

Report:

- The upstream range merged into `main`.
- How the fullscreen contract was preserved or simplified.
- Focused tests, repository checks, build, and product smoke results.
- `synp`, `omp`, and absent `syn-p` command resolution.
- Candidate ancestry and `origin/main` push status.
- Backup ref retained for rollback.
