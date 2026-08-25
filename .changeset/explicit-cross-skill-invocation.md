---
"mattpocock-skills": patch
---

Make operative cross-skill dependencies explicit with harness-neutral `/skill`-style prose across `mp-code-review`, `diagnosing-bugs`, `grill-with-docs`, `grill-me`, `improve-codebase-architecture`, `tdd`, `to-spec`, `to-tickets`, `triage`, and `wayfinder`.

- Name each required model-invoked skill directly and say to run or invoke it; do not depend on one harness's tool name.
- When a step needs multiple skills, name each dependency separately.
- Keep user-only skills human-routed: tell the human what command to run rather than trying to invoke it from another skill.
- Document the convention in `.agents/invocation.md`.
