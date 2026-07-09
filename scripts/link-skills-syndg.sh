#!/usr/bin/env bash
set -euo pipefail

# syndg's installer for this fork.
#
# Links every skill from the linked buckets into the skill directories used by
# each agent harness, flattening the bucket structure:
#   - ~/.claude/skills  — Claude Code
#   - ~/.agents/skills  — Agent-Skills-standard harnesses (pi, opencode, ...)
#   - ~/.codex/skills   — Codex CLI
# Each entry is a symlink into this repo, so a `git pull` keeps installed
# skills current. Re-run after adding, removing, or renaming a skill.
#
# Kept separate from Matt's scripts/link-skills.sh so upstream merges never
# touch this file.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DESTS=("$HOME/.claude/skills" "$HOME/.agents/skills" "$HOME/.codex/skills")
BUCKETS=(engineering productivity personal vendor)

# Collect skills from the linked buckets.
names=()
srcs=()
for bucket in "${BUCKETS[@]}"; do
  [ -d "$REPO/skills/$bucket" ] || continue
  while IFS= read -r -d '' skill_md; do
    src="$(dirname "$skill_md")"
    names+=("$(basename "$src")")
    srcs+=("$src")
  done < <(find "$REPO/skills/$bucket" -mindepth 2 -maxdepth 2 -name SKILL.md -print0)
done

echo "Linking ${#names[@]} skills from ${BUCKETS[*]}"

for DEST in "${DESTS[@]}"; do
  # Legacy setups pointed the whole directory at a skills repo. Replace any
  # such symlink with a real directory of per-skill links.
  if [ -L "$DEST" ]; then
    echo "replacing whole-dir symlink $DEST -> $(readlink "$DEST")"
    rm "$DEST"
  fi
  mkdir -p "$DEST"

  # Prune dead or stale per-skill links from previous runs.
  for existing in "$DEST"/*; do
    [ -L "$existing" ] || continue
    target="$(readlink "$existing")"
    case "$target" in
      "$REPO"/*|"$HOME/Dotfiles/skills"/*)
        keep=false
        for i in "${!names[@]}"; do
          if [ "$target" = "${srcs[$i]}" ]; then keep=true; break; fi
        done
        if [ "$keep" = false ]; then
          echo "pruning stale link $(basename "$existing") ($DEST)"
          rm "$existing"
        fi
        ;;
    esac
  done

  for i in "${!names[@]}"; do
    ln -sfn "${srcs[$i]}" "$DEST/${names[$i]}"
  done
  echo "linked ${#names[@]} skills into $DEST"
done
