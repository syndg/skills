#!/usr/bin/env bash
set -euo pipefail

repo_input="${1:-$HOME/skills}"
base="${2:-}"
upstream_ref="${3:-}"
errors=0

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  errors=$((errors + 1))
}

require_path() {
  local path="$1"
  [ -e "$repo/$path" ] || fail "missing downstream path: $path"
}

require_absent() {
  local path="$1"
  [ ! -e "$repo/$path" ] || fail "upstream path should remain excluded: $path"
}

require_text() {
  local path="$1"
  local text="$2"
  if [ ! -f "$repo/$path" ] || ! grep -Fq "$text" "$repo/$path"; then
    fail "$path does not contain expected downstream marker: $text"
  fi
}

if [ ! -d "$repo_input" ]; then
  printf 'FAIL: repository path does not exist: %s\n' "$repo_input" >&2
  exit 1
fi

repo="$(cd "$repo_input" && pwd -P)"
git_root="$(git -C "$repo" rev-parse --show-toplevel 2>/dev/null || true)"
if [ -n "$git_root" ]; then
  git_root="$(cd "$git_root" && pwd -P)"
fi
if [ "$git_root" != "$repo" ]; then
  printf 'FAIL: %s is not the skills repository root\n' "$repo_input" >&2
  exit 1
fi

# Repository-contract and decision-storage adaptations.
require_path "skills/engineering/domain-modeling/AGENTS-FORMAT.md"
require_absent "skills/engineering/domain-modeling/CONTEXT-FORMAT.md"
require_text "skills/engineering/domain-modeling/SKILL.md" 'When `dox.config.json` is present'
require_text "skills/engineering/domain-modeling/ADR-FORMAT.md" "DECISIONS.md"
require_text "skills/engineering/setup-matt-pocock-skills/SKILL.md" "Domain docs"
require_text "skills/engineering/setup-matt-pocock-skills/domain.md" "Configured DOX branch"
require_text "skills/personal/skills-fork-update/SKILL.md" "DOX is a direct-cutover store"
require_text "skills/personal/skills-fork-update/SKILL.md" "This is the AGENTS/DECISIONS fallback, not DOX"
require_text "AGENTS.md" "Repository-aware skills must preserve the DOX direct-cutover contract"
require_text "CLAUDE.md" "Keep this file limited to Claude-specific operational instructions and pointers"
require_text ".agents/invocation.md" 'dox.config.json'
require_text "AGENTS.md" "never initializes DOX"
require_absent ".agents/adr"
[ ! -L "$repo/AGENTS.md" ] || fail "AGENTS.md must be a canonical file, not a CLAUDE.md symlink"
[ ! -L "$repo/CLAUDE.md" ] || fail "CLAUDE.md must remain a harness-only file, not a contract symlink"
require_text ".agents/writing-docs.md" 'dox.config.json'
require_text "skills/productivity/handoff/SKILL.md" "A receipt is a local manifest, not loaded contract prose"
require_text "skills/in-progress/implement-spec/SKILL.md" "every implementer runs resolution from inside its assigned worktree"
require_text "skills/engineering/mp-code-review/SKILL.md" "first repository operation"
for path in \
  diagnosing-bugs \
  ask-matt \
  codebase-design \
  implement \
  improve-codebase-architecture \
  mp-code-review \
  research \
  resolving-merge-conflicts \
  prototype \
  tdd \
  to-spec \
  to-tickets \
  triage \
  wayfinder \
  wizard
do
  require_text "skills/engineering/$path/SKILL.md" 'dox.config.json'
  require_text "skills/engineering/$path/SKILL.md" 'DECISIONS.md'
done
for path in \
  diagnosing-bugs \
  codebase-design \
  implement \
  research \
  tdd \
  to-spec \
  to-tickets \
  wayfinder
do
  require_text "skills/engineering/$path/SKILL.md" 'worktree resolves locally'
done
for path in \
  handoff \
  unslop \
  wait-what \
  writing-for-agents
do
  require_text "skills/productivity/$path/SKILL.md" 'dox.config.json'
  require_text "skills/productivity/$path/SKILL.md" 'DECISIONS.md'
done
for path in \
  wiki-digest \
  wiki-fetch-readwise-highlights \
  wiki-fetch-readwise-document \
  wiki-import-readwise \
  wiki-ingest \
  wiki-ingest-new \
  wiki-ingest-song \
  wiki-ingest-tweets \
  wiki-ingest-youtube \
  wiki-lint
do
  require_text "skills/personal/$path/SKILL.md" 'dox.config.json'
  require_text "skills/personal/$path/SKILL.md" 'DECISIONS.md'
done
require_text "skills/vendor/generate-project-plan/references/foundation/codebase-grounding.md" 'dox.config.json'
for path in \
  figma-code-connect \
  figma-design-to-code \
  figma-generate-design \
  figma-generate-library \
  figma-implement-motion \
  figma-swiftui \
  frontend-design \
  impeccable \
  react-doctor \
  skill-creator
do
  require_text "skills/vendor/$path/SKILL.md" 'dox.config.json'
  require_text "skills/vendor/$path/SKILL.md" 'DECISIONS.md'
  require_text "skills/vendor/$path/SKILL.md" 'worktree'
done
for path in \
  git-guardrails-claude-code \
  migrate-to-shoehorn \
  scaffold-exercises \
  setup-pre-commit
do
  require_text "skills/misc/$path/SKILL.md" 'dox.config.json'
  require_text "skills/misc/$path/SKILL.md" 'DECISIONS.md'
  require_text "skills/misc/$path/SKILL.md" 'worktree'
done

# Fork naming and local harness integration.
require_absent ".claude-plugin"
require_path "skills/engineering/mp-code-review/SKILL.md"
require_absent "skills/engineering/code-review/SKILL.md"
require_text "README.md" "skills/engineering/mp-code-review/SKILL.md"
require_text "skills/engineering/ask-matt/SKILL.md" "/skills-fork-update"
require_text "skills/engineering/ask-matt/SKILL.md" "/pi-update"
require_text "docs/engineering/ask-matt.md" "/skills-fork-update"
require_text "docs/engineering/ask-matt.md" "/pi-update"
require_text "skills/personal/README.md" "skills-fork-update"
require_text "skills/personal/README.md" "pi-update"
require_path "scripts/link-skills-syndg.sh"
require_text "CLAUDE.md" "scripts/link-skills-syndg.sh"
[ -x "$repo/scripts/link-skills-syndg.sh" ] || fail "scripts/link-skills-syndg.sh is not executable"

# The complete personal skill inventory maintained by this fork.
for path in \
  cmux \
  pi-update \
  skills-fork-update \
  synclaw-server \
  wiki-digest \
  wiki-fetch-readwise-document \
  wiki-fetch-readwise-highlights \
  wiki-import-readwise \
  wiki-ingest \
  wiki-ingest-new \
  wiki-ingest-song \
  wiki-ingest-tweets \
  wiki-ingest-youtube \
  wiki-lint \
  youtube-history-db
do
  require_path "skills/personal/$path/SKILL.md"
  require_text "skills/personal/README.md" "[$path](./$path/SKILL.md)"
  require_path "skills/personal/$path/agents/openai.yaml"
done
if [ "${ALLOW_EDIT_ARTICLE:-0}" = "1" ]; then
  require_path "skills/personal/edit-article/SKILL.md"
  require_text "skills/personal/README.md" "[edit-article](./edit-article/SKILL.md)"
  require_path "skills/personal/edit-article/agents/openai.yaml"
else
  require_absent "skills/personal/edit-article/SKILL.md"
fi
if [ "${ALLOW_OBSIDIAN_VAULT:-0}" = "1" ]; then
  require_path "skills/personal/obsidian-vault/SKILL.md"
  require_text "skills/personal/README.md" "[obsidian-vault](./obsidian-vault/SKILL.md)"
  require_path "skills/personal/obsidian-vault/agents/openai.yaml"
else
  require_absent "skills/personal/obsidian-vault/SKILL.md"
fi

# The complete vendor skill inventory maintained by this fork.
for path in \
  docx \
  figma-code-connect \
  figma-create-new-file \
  figma-design-to-code \
  figma-generate-design \
  figma-generate-diagram \
  figma-generate-library \
  figma-implement-motion \
  figma-swiftui \
  figma-use \
  figma-use-figjam \
  figma-use-motion \
  figma-use-slides \
  frontend-design \
  generate-project-plan \
  impeccable \
  pdf \
  playwright-cli \
  react-doctor \
  skill-creator \
  vercel-composition-patterns \
  vercel-react-best-practices \
  video-interaction-mapper \
  web-animation-design \
  xlsx
do
  require_path "skills/vendor/$path/SKILL.md"
  require_text "skills/vendor/README.md" "[$path](./$path/SKILL.md)"
done
require_absent "skills/vendor/brainstorming/SKILL.md"

# Teaching fork and lesson-kit assets.
for path in \
  skills/productivity/teach/SKILL.md \
  skills/productivity/teach/DESIGN_REFERENCE.md \
  skills/productivity/teach/LEARNING-RECORD-FORMAT.md \
  skills/productivity/teach/MISSION-FORMAT.md \
  skills/productivity/teach/RESOURCES-FORMAT.md \
  skills/productivity/teach/lesson-kit/DESIGN.md \
  skills/productivity/teach/lesson-kit/DESIGN_SYSTEM.md \
  skills/productivity/teach/lesson-kit/README.md \
  skills/productivity/teach/lesson-kit/base.css \
  skills/productivity/teach/lesson-kit/index.template.html \
  skills/productivity/teach/lesson-kit/lesson.template.html \
  skills/productivity/teach/lesson-kit/manifest.template.js \
  skills/productivity/teach/lesson-kit/nav.js \
  skills/productivity/teach/lesson-kit/package.template.json \
  skills/productivity/teach/lesson-kit/quiz.js \
  skills/productivity/teach/lesson-kit/shiki.js \
  skills/productivity/teach/lesson-kit/styleguide.html \
  skills/productivity/teach/lesson-kit/viz.js \
  skills/productivity/teach/references/durable-lesson-workflow.md \
  skills/productivity/teach/references/opencode-frontend-ui-delegation.md \
  skills/productivity/teach/references/syndg-learning-lab-publishing.md
do
  require_path "$path"
done

stale_review_refs="$(git -C "$repo" grep -n -E '(^|[^[:alnum:]_-])/code-review([^[:alnum:]_-]|$)|skills/engineering/code-review|skills-code-review' -- README.md skills/engineering docs/engineering .agents .claude-plugin 2>/dev/null || true)"
if [ -n "$stale_review_refs" ]; then
  fail "stale code-review references found:"$'\n'"$stale_review_refs"
fi

stale_linker_refs="$(git -C "$repo" grep -n -F '`scripts/link-skills.sh`' -- CLAUDE.md AGENTS.md 2>/dev/null || true)"
if [ -n "$stale_linker_refs" ]; then
  fail "stale harness-linker instructions found:"$'\n'"$stale_linker_refs"
fi

stale_context_refs="$(git -C "$repo" grep -n -F '`CONTEXT.md`' -- README.md skills/engineering docs/engineering .agents 2>/dev/null || true)"
if [ -n "$stale_context_refs" ]; then
  fail "stale CONTEXT.md storage references found:"$'\n'"$stale_context_refs"
fi

if [ -n "$base" ]; then
  if git -C "$repo" rev-parse --verify "$base^{commit}" >/dev/null 2>&1; then
    base_commit="$(git -C "$repo" rev-parse "$base^{commit}")"
    if ! git -C "$repo" merge-base --is-ancestor "$base_commit" HEAD; then
      fail "candidate HEAD does not contain validation base: $base_commit"
    fi
    if ! git -C "$repo" diff --check "$base_commit" HEAD; then
      fail "git diff --check reported whitespace errors in $base_commit..HEAD"
    fi

    if [ -z "$upstream_ref" ]; then
      fail "an upstream ref is required when validating a merge candidate"
    elif git -C "$repo" rev-parse --verify "$upstream_ref^{commit}" >/dev/null 2>&1; then
      upstream_commit="$(git -C "$repo" rev-parse "$upstream_ref^{commit}")"
      if ! git -C "$repo" merge-base --is-ancestor "$upstream_commit" HEAD; then
        fail "candidate HEAD does not contain upstream tip: $upstream_commit"
      fi

      read -r -a head_with_parents <<< "$(git -C "$repo" rev-list --parents -n 1 HEAD)"
      if [ "${#head_with_parents[@]}" -ne 3 ]; then
        fail "candidate HEAD must be a two-parent merge commit"
      else
        [ "${head_with_parents[1]}" = "$base_commit" ] || fail "candidate merge first parent is not validation base: $base_commit"
        [ "${head_with_parents[2]}" = "$upstream_commit" ] || fail "candidate merge second parent is not upstream tip: $upstream_commit"
      fi
    else
      fail "upstream validation ref is not a commit: $upstream_ref"
    fi
  else
    fail "validation base is not a commit: $base"
  fi
fi

if ! git -C "$repo" diff --check; then
  fail "git diff --check reported whitespace errors in the working tree"
fi

if [ "$errors" -ne 0 ]; then
  printf '\nFork validation failed with %d error(s).\n' "$errors" >&2
  exit 1
fi

printf 'Fork validation passed: repository-contract storage, naming, personal, teaching, vendor, and linker adaptations are present.\n'
