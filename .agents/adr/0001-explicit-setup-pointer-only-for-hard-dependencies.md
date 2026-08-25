# Explicit `/setup-matt-pocock-skills` pointer only for hard dependencies

Engineering skills depend on per-repo config (issue tracker, triage label vocabulary, AGENTS/DOX domain contract) seeded by `/setup-matt-pocock-skills`. Some skills cannot meaningfully function without that config: they have to publish to a specific issue tracker or apply a specific label string. Others only use it to sharpen output (vocabulary and architectural-decision awareness) and degrade gracefully without it.

We split these into **hard-dependency** and **soft-dependency** skills:

- **Hard dependency** (`to-tickets`, `to-spec`, `triage`): include an explicit one-liner telling the human to run `/setup-matt-pocock-skills` when the mapping is absent. A skill cannot invoke this user-only setup command itself. Without the mapping, output is wrong, not just fuzzy.
- **Soft dependency** (`diagnosing-bugs`, `tdd`, `improve-codebase-architecture`): retrieve the applicable project contract when configured and otherwise degrade gracefully. If the records are absent, the skill still works; output is just less sharp.

The split keeps soft-dependency skills token-light and avoids cargo-culting the setup pointer into places where it isn't load-bearing.
