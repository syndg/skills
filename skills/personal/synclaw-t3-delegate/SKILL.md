---
name: synclaw-t3-delegate
description: Delegate a task or continue current work in T3 Code on synclaw. Use when the user says "hand this off to T3", "continue on synclaw", "send this task to server Codex", or asks an agent to checkpoint, push, sync, and launch remote work. Defaults to T3-managed Codex with gpt-5.6-sol at high reasoning effort and full access unless explicitly overridden. Not for SSH-only operations or talking to Synclaw AI.
---

# Delegate to T3 Code on synclaw

Move the current task's code and reasoning to a new T3-managed agent thread. The calling harness does not matter; it needs filesystem access, Git, SSH to `synclaw`, and permission to perform the requested handoff. A fresh remote thread does not inherit this conversation.

## Defaults and authority

- Provider instance `codex`, model `gpt-5.6-sol`, reasoning effort `high`, runtime mode `full-access`, interaction mode `default`. Set `modelSelection.options` to `[{"id":"reasoningEffort","value":"high"}]` in both `thread.create` and `thread.turn.start`; omitting effort can inherit `low`. Include effort in the handoff and receipt, and verify the persisted selection contains it. Resolve the live Codex instance if its ID changes. Explicit user overrides win; preserve model IDs exactly. For another provider, use its supported effort option rather than sending a Codex-specific option blindly. If the selected provider/model/effort is unavailable, report the blocker instead of silently substituting.
- Full access is the user's chosen default for this skill. It allows server-user privileges, not just worktree edits. An isolated worktree prevents Git collisions; it is not a security sandbox. Task-specific restrictions and the invoking harness's approval policy still apply.
- A delegation request authorizes checkpointing and pushing the current task's work, preparing its server worktree, and starting its T3 turn. It does not authorize unrelated commits, force pushes, merging to main, deployments, destructive cleanup, or copying secrets into Git or the handoff.
- Transfer ownership once the remote turn starts. Do not keep editing the handed-off branch locally. For continued parallel local work, create a separate branch/worktree.

## 1. Establish the handoff

Extract the goal, exact remaining work, accepted decisions, non-goals, and acceptance criteria from the current conversation. Ask only for missing information that affects execution. An explicit task can be delegated without existing work; a vague "continue this" with no usable context cannot.

Use `/synclaw-server` for server access. Read [T3 API procedure](references/t3-api.md) before authenticating or dispatching.

For repository work, identify the actual current worktree, repository common directory, branch or detached HEAD, push destination, and all changed/untracked files. Use repository identity and Git remote URLs to find the matching server clone under `/home/syndg/Coding`; a worktree directory's basename is not repository identity. Resolve ambiguity from local Git config and server remotes before asking.

For a configured repository (`dox.config.json`), follow `/dox` for retrieval eligibility, reuse, and delegated-worktree grounding. Otherwise read the applicable root-to-nearest `AGENTS.md` chain and indexed co-located `DECISIONS.md` entries. Pass the chosen contract route and relevant pointers to the receiver; do not invent a parallel contract document.

Completion: the task, source worktree, destination repository, selected provider/model, and permission mode are known. For a non-repository task, select a dedicated server task directory and skip Git checkpoint/push rather than initializing or publishing an unrelated repository.

## 2. Checkpoint and publish

Stop or coordinate any writers sharing this worktree before taking the snapshot. Inspect staged, unstaged, and untracked work. Preserve all task-relevant work, including unfinished work and user edits that belong to this task. Inspect candidate files for credentials, private data, generated output, and unrelated changes. Stage explicit paths or hunks, not a blind `git add -A`. Keep unrelated staged work out of the checkpoint without discarding it. If ownership cannot be separated safely, ask.

If there is an in-progress merge/rebase or unresolved conflict, stop the handoff and report it; do not auto-resolve it just to push. For detached HEAD or a protected/default branch, create a named task branch before committing. Use the current task branch otherwise. Respect existing stacked-PR conventions through `/gh-stack` when applicable; do not restructure a stack for the handoff.

Commit the task checkpoint with an honest message. A work-in-progress checkpoint need not pass all tests: record failures and checks not run. Do not bypass hooks or claim a green build. If task work is already committed, reuse HEAD without an empty commit.

Choose a unique remote handoff ref such as `handoff/<task-slug>-<unique-id>` and push the checkpoint there with an explicit refspec. This preserves the exact source snapshot without moving shared branches. Reuse an existing handoff ref only when resuming the same transfer and its recorded SHA still matches. No force push.

Verify the advertised remote ref equals the checkpoint SHA. Record the source branch, push remote/repository, handoff ref, and SHA. Publication of a branch is what transfers a Git worktree's committed content; it does not transfer ignored files, the index, dependencies, or the directory itself.

Completion: every intended source change is in the advertised checkpoint, and excluded files or unresolved prerequisites are documented.

## 3. Prepare synclaw at the exact checkpoint

Verify the server clone points to the same repository. If absent, clone the confirmed remote into an unused path under `/home/syndg/Coding`; verify server Git authentication before proceeding. Fetch the handoff ref explicitly and verify its fetched SHA against the recorded source SHA.

Create a fresh branch and worktree at that SHA in a unique directory under `/home/syndg/Coding/t3-worktrees`. Use a branch derived from the unique handoff ref, then configure its upstream/push destination to that handoff ref. Existing server worktrees, dirty checkouts, and active T3 threads remain untouched. On retry, reuse only the recorded worktree whose repository, branch, SHA, and T3 ownership match; report divergence rather than resetting it.

Inspect the project's setup instructions and existing T3 setup scripts. Use the repository's package manager and lockfile. Do not copy macOS dependencies to Linux. Avoid running both manual setup and the same T3 setup script. For required ignored environment files, use `/synclaw-env-sync` when available and applicable to this destination; verify the actual new worktree receives the intended files. Otherwise report the missing prerequisite. Secrets stay out of logs, Git, prompts, and receipt files.

Completion: the server worktree starts at the exact checkpoint and has either usable prerequisites or explicitly documented setup work the receiver can perform. Do not start a task already known to be impossible there, such as a required macOS-only build with no alternative verification path.

## 4. Write the receiver's handoff

Create `/home/syndg/.local/state/t3-handoffs/<unique-id>/handoff.md`, outside the code worktree. Keep a local receipt in a private state directory, not in repository history. Use restrictive directory/file permissions. Include the complete handoff text in the initial T3 message as well as its server path, so the thread remains understandable without the calling harness.

Use this structure, filling every applicable section with concrete facts:

```markdown
# Task
User goal, remaining actions, acceptance criteria, and explicit non-goals.

## Ownership and baseline
Repository remote; source branch; handoff ref; checkpoint SHA;
server worktree; result push destination; handoff ID.
This thread owns subsequent edits to the server handoff branch.

## Decisions and context
Accepted decisions and reasons; rejected approaches that matter;
relevant files/symbols; DOX route or fallback contract pointers.

## Current state
Completed work; unfinished work; user edits carried forward;
known failures; exact checks run and their observed results.

## Environment
Setup commands already run; remaining setup; required services;
secret file locations without values; platform limitations.

## Execution contract
Selected provider/model and permission mode; task-specific restrictions.
Read the applicable repository contracts before changing behavior.
Complete the remaining task and verify the actual changed behavior.
Commit relevant results and push the handoff branch without force.
Do not merge, deploy, or modify unrelated work unless the task authorizes it.
If blocked, preserve work and report the exact blocker in this thread.

## Completion report
Return changed behavior, verification evidence, remaining risks,
result commit SHA, and pushed ref. Distinguish completion from partial work.
```

For a non-code task, specify its deliverable path and omit commit/push requirements. Transfer necessary nonsecret input files explicitly; local-only attachments and paths do not become available through a prompt.

## 5. Dispatch through T3 and verify

Follow the API reference. Reuse an existing T3 project matching the verified repository root, or create one. Bind the new thread explicitly to the prepared server branch/worktree. For non-repository tasks, use the dedicated task directory as the project root. Do not launch `codex exec`, a raw app-server process, or another T3 service as a substitute: the task must belong to the running T3 server.

Before sending, persist the project ID, thread ID, message ID, command IDs, exact payload, worktree, checkpoint, and handoff path in the receipt. Then dispatch. This receipt is also the recovery point after a disconnect.

Read the thread snapshot until it shows provider startup/turn activity, a completed reply, or a concrete error. Confirm the selected model and worktree in T3 state. An HTTP success only means T3 accepted the command, not that Codex ran. If startup fails, report it and preserve the checkpoint/worktree. On uncertain delivery, query the recorded thread/message before retrying. Reuse the original command/message IDs if a retry is needed; do not create a second task with new IDs.

Return the handoff ID, provider/model, permission mode, branch and SHA, server worktree, T3 thread ID, handoff path, and observed state (`started`, `completed`, or `blocked`). Include a thread link only when its real UI base URL and route are known. Do not put a bearer token in a link.

The default is asynchronous delegation: stop local task execution after verified remote startup. If the user asks to wait, monitor the same thread through completion. Later status requests use the receipt and T3 state, not a second dispatch. After results are pushed, fetching and reviewing them locally is safe; merging them is a separate user decision.
