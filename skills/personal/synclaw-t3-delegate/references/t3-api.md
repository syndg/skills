# T3 API procedure

Use the running server's HTTP API over SSH. Keep credentials and HTTP requests on synclaw; the API is loopback-bound and needs no new tunnel or public listener.

## Discover the running version

The inspected deployment uses:

- Service: `systemctl --user ... t3code.service`
- State root: `/home/syndg/.t3`
- Active version: `runtime/service-state.json`, field `activeVersion`
- CLI: `runtime/versions/<activeVersion>/node_modules/t3/dist/bin.mjs`, invoked with `/usr/bin/node`
- Live origin: `userdata/server-runtime.json`, field `origin`
- Model inventory: `userdata/model-manifest.json`
- Provider instance configuration: `userdata/settings.json`, field `providerInstances`

These paths were inspected against service v0.0.40 on 2026-09-08. Discover them again if the service layout changes. At inspection, `/home/syndg/.local/bin/t3` was v0.0.31, older than the running service. Do not use that launcher for control-plane operations without checking its version.

Read only the needed settings fields. Provider settings may contain sensitive environment data. The configured `codex` instance had driver `codex` and was enabled; the model manifest listed `gpt-5.6-sol`. Inventory membership is not proof that a provider can start a turn.

## Authenticate without exposing credentials

Run the active CLI on synclaw:

```text
/usr/bin/node <active-cli> auth session issue --base-dir /home/syndg/.t3 --ttl 5m --label <handoff-id> --json
```

Capture stdout in a remote Bun/Node process, not in the agent transcript. The JSON includes `sessionId` and `token`. Send `Authorization: Bearer <token>` on HTTP requests to the discovered origin. Use `Content-Type: application/json` for POST bodies. Parse responses and treat non-2xx status as an error.

The inspected CLI issues administrative scopes, despite describing the credential as scoped. Use a short TTL and revoke in `finally`:

```text
/usr/bin/node <active-cli> auth session revoke --base-dir /home/syndg/.t3 <sessionId>
```

Use a remote process with argument arrays, such as Node `execFileSync` or Bun `spawn`, for CLI calls. Keep tokens in process memory. Avoid shell interpolation of prompts, URLs, branches, paths, and tokens. Pass JSON through stdin or a private file. Print only nonsecret receipts and selected status fields. A monitoring request after expiry can issue a new short-lived session; revoking the HTTP credential does not cancel the T3 agent thread.

## HTTP operations

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/auth/session` | Verify authentication |
| GET | `/api/orchestration/shell` | List project/thread metadata |
| GET | `/api/orchestration/threads/<threadId>` | Read one thread, session, turn, and messages |
| POST | `/api/orchestration/dispatch` | Submit a command object directly as the JSON body |

Match an existing project by its canonical `workspaceRoot`, not just title. For a missing project, dispatch:

```json
{
  "type": "project.create",
  "commandId": "<stable-uuid>",
  "projectId": "<stable-uuid>",
  "title": "<repository-or-task-name>",
  "workspaceRoot": "<absolute-server-project-root>",
  "createdAt": "<ISO-8601-timestamp>"
}
```

Generate UUIDs and timestamps with standard library functions. Persist them before sending. The placeholders in these examples describe inputs, not literal strings to submit.

## Start a turn in the prepared worktree

The v0.0.40 HTTP dispatcher requires an explicit `thread.create` before `thread.turn.start`. Its schema accepts bootstrap metadata, but a live request with `bootstrap.createThread` alone failed with "Thread ... does not exist". Use two commands, not the bootstrap shortcut.

First dispatch:

```json
{
  "type": "thread.create",
  "commandId": "<stable-create-command-uuid>",
  "threadId": "<stable-thread-uuid>",
  "projectId": "<existing-or-created-project-uuid>",
  "title": "<task-title>",
  "modelSelection": {
    "instanceId": "codex",
    "model": "gpt-5.6-sol",
    "options": [{ "id": "reasoningEffort", "value": "high" }]
  },
  "runtimeMode": "full-access",
  "interactionMode": "default",
  "branch": "<prepared-server-branch>",
  "worktreePath": "<absolute-prepared-server-worktree>",
  "createdAt": "<ISO-8601-timestamp>"
}
```

After the thread exists, dispatch the initial turn. The wire model uses `instanceId`, not a model-provider alias:

```json
{
  "type": "thread.turn.start",
  "commandId": "<stable-command-uuid>",
  "threadId": "<stable-thread-uuid>",
  "message": {
    "messageId": "<stable-message-uuid>",
    "role": "user",
    "text": "<complete-handoff-and-server-handoff-path>",
    "attachments": []
  },
  "modelSelection": {
    "instanceId": "codex",
    "model": "gpt-5.6-sol",
    "options": [{ "id": "reasoningEffort", "value": "high" }]
  },
  "runtimeMode": "full-access",
  "interactionMode": "default",
  "createdAt": "<ISO-8601-timestamp>"
}
```

Apply explicit provider/model, reasoning-effort, and permission overrides to both selections/modes. Set high effort explicitly for the default Codex selection; omitting `options` can inherit low effort. For a task whose project root is itself the dedicated task directory, `branch` and `worktreePath` may be JSON `null`; the provider then uses the project root. For a repository handoff under an existing project, set the branch and worktree explicitly.

Omit bootstrap fields on this HTTP path. Prepare the exact worktree and run required setup explicitly before starting the turn. A schema accepting a field does not prove the HTTP handler executes its side effects.

## Observe and recover

The thread-detail response contains `thread`. Inspect its `modelSelection`, `branch`, `worktreePath`, `session`, `latestTurn`, and `messages`. Confirm `modelSelection.options` includes `{"id":"reasoningEffort","value":"high"}` unless explicitly overridden. Error details and pending approvals matter more than a successful dispatch response. Do not print entire unrelated project/thread histories.

If the HTTP connection drops, read the same thread. A persisted user message or turn proves the command reached T3; do not blindly resend. If the outcome is still uncertain, preserve the receipt and report uncertain delivery rather than duplicating work. For a deliberate retry of an unaccepted command, use its original IDs and payload.

To interrupt the recorded task when the user requests it:

```json
{
  "type": "thread.turn.interrupt",
  "commandId": "<new-uuid>",
  "threadId": "<recorded-thread-uuid>",
  "createdAt": "<ISO-8601-timestamp>"
}
```

Re-read state to verify the stop. Do not stop the whole T3 service. Completed threads can be archived with `thread.archive`, `commandId`, and `threadId`; normal handoffs should remain visible unless the user asks otherwise.

If an upgrade rejects these shapes, inspect the active runtime's contracts or matching source before changing requests. Do not write directly to `state.sqlite` or manufacture thread/provider state to bypass the API.
