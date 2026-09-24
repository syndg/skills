# Engineering

Skills I use daily for code work.

## User-invoked

Reachable only when you type them (Claude Code: `disable-model-invocation: true`; Codex: `policy.allow_implicit_invocation: false` in `agents/openai.yaml`).

- **[ask-matt](./ask-matt/SKILL.md)** — Ask which skill or flow fits your situation. A router over the skills in this repo.
- **[grill-with-docs](./grill-with-docs/SKILL.md)** — Grilling session that records settled language and decisions in canonical DOX records when configured, or the applicable AGENTS fallback otherwise.
- **[triage](./triage/SKILL.md)** — Move issues through a state machine of triage roles.
- **[improve-codebase-architecture](./improve-codebase-architecture/SKILL.md)** — Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.
- **[setup-matt-pocock-skills](./setup-matt-pocock-skills/SKILL.md)** — Configure the issue tracker, triage labels, and contract lookup. Preserves configured DOX records; scaffolds the AGENTS fallback only when unconfigured.
- **[to-spec](./to-spec/SKILL.md)** turns the settled conversation into one approved spec issue with a detailed implementation plan for a fresh session.
- **[to-tickets](./to-tickets/SKILL.md)** splits a plan into tracer-bullet issues with blocking edges only on explicit human request. Size or session count does not require it.
- **[implement](./implement/SKILL.md)** builds from a spec, explicit build issues, or settled conversation, drives `/tdd` at agreed seams, and directly runs independent `/mp-code-review` reviews before a gated, permitted commit.
- **[wayfinder](./wayfinder/SKILL.md)** — Plan a huge chunk of work — more than one agent session can hold — as a shared map of decision tickets on the issue tracker, resolved one at a time until the way to the destination is clear.

## Model-invoked

Model- or user-reachable (rich trigger phrasing so the model can reach for them).

- **[prototype](./prototype/SKILL.md)** — Build throwaway code to answer a design question: a shareable HTML state/logic demo, or several toggleable UI variations.
- **[wizard](./wizard/SKILL.md)** — Generate an interactive shell guide for human-only setup, migration, and operational steps.
- **[diagnosing-bugs](./diagnosing-bugs/SKILL.md)** — Disciplined diagnosis loop for hard bugs and performance regressions: reproduce → minimise → hypothesise → instrument → fix → regression-test.
- **[research](./research/SKILL.md)** — Investigate a question against high-trust primary sources and capture the findings as a cited Markdown file in the repo, run as a background agent.
- **[tdd](./tdd/SKILL.md)** — Test-driven development with a red-green-refactor loop. Builds features or fixes bugs one vertical slice at a time.
- **[domain-modeling](./domain-modeling/SKILL.md)** — Actively build and sharpen a project's domain model — challenge terms, stress-test with scenarios, and adjudicate durable terminology and decisions in the project contract.
- **[dox](./dox/SKILL.md)** — Curated repository meaning, applicable binding obligations, and canonical contract maintenance.
- **[codebase-design](./codebase-design/SKILL.md)** — Shared discipline and vocabulary for designing deep modules: small interfaces, clean seams, testable through the interface.
- **[mp-code-review](./mp-code-review/SKILL.md)** runs independent Standards and Spec reviews with simplicity and test-value checks, designated-model routing when supplied, and portable briefs when required routing is unavailable.
- **[resolving-merge-conflicts](./resolving-merge-conflicts/SKILL.md)** — Work through an in-progress git merge or rebase conflict hunk by hunk, resolving by intent traced to each side's primary source, then finish the operation — never `--abort`.
