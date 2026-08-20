---
name: skills-fork-update
description: Update the user's maintained fork of Matt Pocock's skills repository, preserve the local AGENTS/DOX and DECISIONS.md adaptations plus personal/vendor customizations, validate the merged result, and leave pushing to the user. Use whenever the user says "update my skills", "sync the skills fork", "pull Matt's skills upstream", "check the skills repo for updates", or asks what changed in mattpocock/skills. Do not use for updating one installed skill, Pi itself, or an unrelated skills repository.
---

# Skills Fork Update

Maintain the user's skills repository as a downstream fork of Matt Pocock's skills while carrying forward the user's own storage conventions, skills, and harness integration.

## Repository identity

- Working repository: `~/skills`
- Official upstream: `https://github.com/mattpocock/skills.git`
- Personal fork: `git@github.com:syndg/skills.git`
- Maintained branch: `main`
- Preferred remote names: `upstream` for Matt's repository and `origin` for the personal fork
- Fork validator: `scripts/validate-fork.sh` inside this skill
- Harness linker: `scripts/link-skills-syndg.sh` at the repository root

Identify remotes by normalized URL rather than trusting their names. Accept SSH or HTTPS forms of the same GitHub repository. Stop if `~/skills` or its remotes identify a different repository.

## Choose the mode from the request

- **Report only:** requests such as “check for updates,” “compare our state,” or “what changed upstream.” Fetch and summarize, but do not merge.
- **Integrate:** requests such as “update,” “sync,” “pull in upstream,” or “bring us current.” Fetch, summarize, merge, and validate without asking again merely because updates exist.

If the wording genuinely does not reveal whether the user wants integration, default to report-only.

## Safety contract

- Inspect branch, remotes, status, recent history, and divergence before changing refs.
- Never stash, discard, reset, clean, force-push, or delete the user's work.
- Stop integration when tracked files are modified. Report-only mode may continue because fetch does not touch the working tree.
- Start integration only when `main` is checked out. Report-only mode may run from another branch because it does not switch branches or change the working tree.
- Show untracked paths. They may remain when they cannot collide with incoming tracked paths; generated caches such as `__pycache__/` are not by themselves a reason to delete or stash anything.
- Fetch both official upstream and the personal fork before deciding what is current.
- Stop if local `main` does not contain `origin/main`; do not silently reconcile personal-fork divergence as part of an upstream sync.
- Integrate with a merge commit, matching this fork's established history. Do not rebase the downstream customization stack.
- Do not push. End with the local branch ahead of `origin/main` and tell the user exactly what remains unpublished.

## Preservation contract

Treat the downstream commits and current downstream diff as intent, not noise. Preserve these adaptations while accepting upstream improvements:

1. **AGENTS/DOX storage**
   - Domain language lives in the applicable `AGENTS.md` hierarchy.
   - Architectural decisions live inline in `AGENTS.md` while small, then move to a co-located `DECISIONS.md` while retaining an index in `AGENTS.md`.
   - Preserve `skills/engineering/domain-modeling/AGENTS-FORMAT.md` and do not restore `CONTEXT-FORMAT.md` as the storage contract.
   - When upstream changes a customized engineering skill or doc, carry its new behavior forward but translate storage guidance into the fork's AGENTS/DOX vocabulary.

2. **Fork naming and flows**
   - Preserve `mp-code-review`; do not silently restore the upstream `code-review` path or stale `/code-review` links.
   - Preserve the fork's AGENTS/DOX adaptations across the engineering flow and setup documentation.

3. **Personal and vendor inventory**
   - Preserve the user's personal wiki, Readwise, YouTube history, Synclaw, cmux, and Syn Pi maintenance skills.
   - Preserve the vendor bucket and its third-party skills.
   - Keep upstream's `edit-article` and `obsidian-vault` personal skills excluded unless the user explicitly asks to adopt them. For an intentional adoption, run validation with `ALLOW_EDIT_ARTICLE=1` and/or `ALLOW_OBSIDIAN_VAULT=1` and report the exception.
   - Keep the removed brainstorming skill excluded.

4. **Other downstream work**
   - Preserve the customized `teach` skill and lesson kit.
   - Preserve `scripts/link-skills-syndg.sh` and the flattened links into Claude, Agent Skills/Pi, and Codex harness directories.
   - Accept genuinely new upstream skills and behavior unless they conflict with one of the explicit downstream decisions above.

Never resolve a conflict by broadly choosing all of `ours` or `theirs`. Read the upstream change, the downstream version, and the fork-only commits touching that file; then produce a semantic combination. If intent remains uncertain, this workflow's candidate-branch safety rule wins: abort that candidate rather than completing a doubtful merge.

## Workflow

### 1. Inspect

From `~/skills`:

- Confirm the active branch and repository root.
- Locate the official and personal remotes by URL.
- Record `OLD_HEAD=$(git rev-parse main)`.
- Inspect `git status --short --branch`, `git branch -vv`, remotes, and recent graph history.
- Record the fork-only commits and the downstream name-status diff against the current merge-base. These are the evidence for preservation during conflict resolution.

### 2. Fetch and compare

Fetch both remotes with pruning. Before deciding whether the fork is current, confirm local `main` contains `origin/main`. If it does not, stop and report the personal-fork divergence rather than returning a misleading upstream-current result. Then compute:

- The merge-base of `main` and the official upstream `main`
- `git rev-list --left-right --count main...<upstream>/main`
- Incoming commits in merge-base-to-upstream order
- Diff stat and name-status for the incoming range
- Direct overlap between incoming paths and downstream-customized paths

Explain substantive changes rather than merely listing commit subjects. Distinguish merge commits from content commits and call out whether skills, scripts, manifests, or only documentation changed.

If official upstream `main` is already an ancestor of local `main`, report that the fork is current with respect to upstream and stop without creating a commit.

In report-only mode, stop after this summary.

### 3. Preflight integration

- Confirm `main` is checked out, tracked files are clean, and the `origin/main` ancestry guard has already passed.
- Use `git merge-tree --write-tree main <upstream>/main` to detect conflicts without touching the working tree.
- Review likely conflict files against the preservation contract.
- Create a temporary candidate branch named `sync/matt-skills-<timestamp>` from `main`. Keep `main` at `OLD_HEAD` until validation passes.

### 4. Merge on the candidate

Merge official upstream `main` with `--no-ff --no-edit` on the candidate branch so the integration remains explicit even when Git could fast-forward.

For conflicts, reconcile behavior semantically. In adapted engineering files, upstream's new workflow behavior should normally be retained while its `CONTEXT.md`/ADR assumptions are translated to AGENTS/DOX. Preserve custom paths, personal skills, vendor skills, and the teaching kit unless the user explicitly changes those decisions.

If the merge cannot be resolved confidently, abort the candidate merge, return to `main`, and report the exact unresolved intent. Do not weaken the preservation contract just to finish.

### 5. Validate the candidate

Run the validator with the pre-merge SHA and fetched upstream ref so it checks ancestry, the merge shape, and the committed range rather than only the clean working tree:

```bash
bash skills/personal/skills-fork-update/scripts/validate-fork.sh ~/skills "$OLD_HEAD" "<upstream>/main"
git diff --check "$OLD_HEAD" HEAD
```

Also:

- Inspect the final diff from `OLD_HEAD` and the downstream diff against the new upstream tip.
- Confirm incoming upstream content is present, not accidentally discarded during conflict resolution.
- If either Claude plugin manifest changed, run `claude plugin validate . --strict` when the CLI is available; report an unavailable validator rather than pretending it passed.
- Run any new validation commands introduced by upstream repository instructions.

### 6. Promote locally

Only after validation passes:

1. Switch back to `main`.
2. Fast-forward `main` to the validated candidate with `git merge --ff-only <candidate>`.
3. Delete the temporary candidate branch.
4. Re-run `scripts/link-skills-syndg.sh` if skills were added, removed, or renamed. Because links target this repository, ordinary content updates need no relinking.
5. Verify final status and divergence from both remotes.

Do not push `origin/main`.

## Failure behavior

Keep `main` at `OLD_HEAD` whenever candidate integration or validation fails. Preserve the candidate branch only when it contains useful conflict-resolution work; otherwise remove it after returning to `main`. Report the failing command, affected files, and safest next action. Never leave the user unknowingly on a temporary branch or in an in-progress merge.

## Completion report

Keep the report compact:

- Old and new upstream SHAs/range
- Substantive upstream changes integrated
- Downstream adaptations preserved or intentionally changed
- Conflicts and validation results
- Final branch/status
- Whether harness links were refreshed
- Explicitly state that the fork was not pushed and how far local `main` is ahead of `origin/main`
