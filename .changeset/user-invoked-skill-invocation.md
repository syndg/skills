---
"mattpocock-skills": patch
---

Stop skills from trying to reach user-invoked skills through model-side invocation. Fix cross-skill references that violated the "no other skill can call it" invariant in `.agents/invocation.md`, including `to-spec`, `wayfinder`, `to-tickets`, `triage`, `mp-code-review`, and `diagnosing-bugs`.

- Tracker-dependent skills now tell the human to run `/setup-matt-pocock-skills` when required setup is absent.
- `diagnosing-bugs` no longer tries to hand off automatically to the user-only `/improve-codebase-architecture` flow.
- `.agents/invocation.md` now states that operative skill dependencies may target only model-invoked skills; user-invoked preconditions remain commands for the human.

Fixes #453.
