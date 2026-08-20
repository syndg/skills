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
# Experimental skills are opt-in so the whole in-progress bucket stays hidden.
ALLOWLIST=(in-progress/batch-grill-me)
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

for relative_skill in "${ALLOWLIST[@]}"; do
  src="$REPO/skills/$relative_skill"
  if [ ! -f "$src/SKILL.md" ]; then
    echo "allowlisted skill is missing SKILL.md: $relative_skill" >&2
    exit 1
  fi
  names+=("$(basename "$src")")
  srcs+=("$src")
done

echo "Linking ${#names[@]} skills from ${BUCKETS[*]} plus allowlisted ${ALLOWLIST[*]}"

for DEST in "${DESTS[@]}"; do
  # Older setups pointed the whole directory at a skills repo. Replace any
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

DOX_LAUNCHER_DIR="$HOME/.local/bin"
DOX_LAUNCHER="$DOX_LAUNCHER_DIR/dox"
mkdir -p "$DOX_LAUNCHER_DIR"
cat > "$DOX_LAUNCHER" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

exec bun "$HOME/.agents/skills/dox/scripts/dox.ts" "$@"
EOF
chmod +x "$DOX_LAUNCHER"
echo "installed DOX launcher at $DOX_LAUNCHER"
