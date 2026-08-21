import { afterEach, describe, expect, test } from "bun:test";
import { link, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const cli = join(import.meta.dir, "..", "scripts", "dox.ts");
const roots: string[] = [];

async function run(root: string, ...args: string[]) {
  const proc = Bun.spawn(["bun", cli, ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
  const [code, stdout, stderr] = await Promise.all([proc.exited, new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  return { code, stdout, stderr };
}

async function git(root: string, ...args: string[]) {
  const proc = Bun.spawn(["git", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
  expect(await proc.exited).toBe(0);
}

async function project(): Promise<string> {
  const root = await mkdtemp("/tmp/dox-v2-test-"); roots.push(root);
  await git(root, "init", "-q");
  await git(root, "config", "user.email", "test@example.test");
  await git(root, "config", "user.name", "DOX Test");
  await mkdir(join(root, "dox", "records"), { recursive: true });
  await mkdir(join(root, "src", "auth"), { recursive: true });
  await writeFile(join(root, "dox.config.json"), '{"schema_version":1,"records_dir":"dox/records","coverage":{"paths":["src/**"]}}\n');
  await writeFile(join(root, "src", "auth", "login.ts"), "export const authorize = () => true;\n");
  await writeFile(join(root, "src", "api.ts"), "export const api = true;\n");
  await writeFile(join(root, "dox", "records", "login.md"), `---
id: login
kind: contract
owner: identity
statement: Login authorization uses one guarded writer.
paths: src/auth/login.ts
symbols: [authorize]
terms: [login, authorization]
---
# Login authorization

All login writes pass through the guarded writer.
`);
  await writeFile(join(root, "dox", "records", "authz.md"), `---
id: authz-invariant
kind: invariant
owner: security
statement: Authorization changes must preserve the guarded writer.
enforced_by:
  - path: src/auth/**
depended_on_by:
  - path: src/api.ts
enforcement: [chokepoint]
verification: [bun test]
failure_modes: [bypass]
impact: security
criticality: critical
state: enforced
---
# Authorization
`);
  await git(root, "add", "."); await git(root, "commit", "-qm", "initial");
  return root;
}

afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

describe("DOX retrieval v2 public CLI", () => {
  test("resolves one natural-language task into deterministic compact context", async () => {
    const root = await project();
    const args = ["resolve", "change login authorization without bypassing the guarded writer", "--path", "src/auth/login.ts"];
    const first = await run(root, ...args);
    const second = await run(root, ...args);

    expect(first.code).toBe(0);
    expect(first.stderr).toBe("");
    expect(first.stdout).toBe(second.stdout);
    expect(first.stdout.endsWith("\n")).toBe(true);
    expect(first.stdout).not.toContain('"body"');

    const data = JSON.parse(first.stdout);
    expect(data.schema).toBe("dox.resolve/v2");
    expect(data.status).toBe("ok");
    expect(data.items.map((item: { id: string }) => item.id)).toEqual(["authz-invariant", "login"]);
    expect(data.items.find((item: { id: string }) => item.id === "authz-invariant").invariant).toEqual({
      statement: "Authorization changes must preserve the guarded writer.",
      state: "enforced",
      enforcement: ["chokepoint"],
      depends_on: [],
      enforced_by: [{ path: "src/auth/**" }],
      depended_on_by: [{ path: "src/api.ts" }],
      verification: ["bun test"],
      failure_modes: ["bypass"],
      impact: "security",
      criticality: "critical",
    });
    expect(data.items.find((item: { id: string }) => item.id === "login").excerpt).toBe("All login writes pass through the guarded writer.");
    expect(data.receipt.binding_complete).toBe(true);
    expect(data.receipt.id).toMatch(/^[a-f0-9]{64}$/);
    expect(Buffer.byteLength(first.stdout)).toBeLessThanOrEqual(16_384);
  });

  test("expands a discovered body as a receipt-backed delta", async () => {
    const root = await project();
    const context = JSON.parse((await run(root, "resolve", "inspect login authorization", "--path", "src/auth/login.ts")).stdout);
    const expanded = await run(root, "resolve", "--from", context.receipt.id, "--expand", "login");

    expect(expanded.code).toBe(0);
    const data = JSON.parse(expanded.stdout);
    expect(data.items).toBeUndefined();
    expect(data.expansions).toEqual([{
      id: "login",
      file: "dox/records/login.md",
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      body: "# Login authorization\n\nAll login writes pass through the guarded writer.\n",
    }]);
    expect(data.expansions[0].sha256).toBe(context.items.find((item: { id: string }) => item.id === "login").body_ref.sha256);
    expect(data.receipt.parent).toBe(context.receipt.id);
    expect(expanded.stdout).not.toContain('"authz-invariant"');

    const repeated = await run(root, "resolve", "--from", data.receipt.id, "--expand", "login");
    expect(repeated.code).toBe(1);
    expect(repeated.stderr).toContain("DOX_ALREADY_EXPANDED");
  });

  test("defers optional capsules before it removes mandatory context", async () => {
    const root = await project();
    for (let index = 0; index < 20; index += 1) {
      await writeFile(join(root, "dox", "records", `optional-${index}.md`), `---\nid: optional-${index}\nkind: contract\nowner: identity\nterms: [login]\n---\n# Optional ${index}\n\n${"Supplemental login guidance. ".repeat(30)}\n`);
    }
    const result = await run(root, "resolve", "inspect login authorization", "--path", "src/auth/login.ts", "--max-bytes", "2400");

    expect(result.code).toBe(0);
    expect(Buffer.byteLength(result.stdout)).toBeLessThanOrEqual(2400);
    const data = JSON.parse(result.stdout);
    expect(data.items.some((item: { id: string }) => item.id === "authz-invariant")).toBe(true);
    expect(data.receipt.binding_complete).toBe(true);
    expect(data.receipt.deferred.length).toBeGreaterThan(0);
  });

  test("does not make an unrelated invariant mandatory from one generic task token", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "rate-limit.md"), `---\nid: rate-limit\nkind: contract\nowner: platform\nstatement: Shared rate limiting uses pseudonymous keys and app-owned outage policy.\nterms: [rate limit, pseudonymous keys, outage policy]\n---\n# Rate limiting\n`);
    await writeFile(join(root, "dox", "records", "catalog-invariant.md"), `---\nid: catalog-invariant\nkind: invariant\nowner: workflows\nstatement: Workflow catalog ownership remains portable.\nterms: [workflow catalog ownership]\nstate: enforced\nenforcement: [test]\nenforced_by:\n  - path: src/workflows/**\ndepended_on_by:\n  - path: src/catalog/**\nverification: [bun test]\nfailure_modes: [catalog-drift]\nimpact: workflow\ncriticality: high\n---\n# Workflow catalog\n`);
    await writeFile(join(root, "dox", "records", "architecture.md"), `---\nid: architecture\nkind: contract\nowner: platform\npaths: src/**\n---\n# Repository architecture\n`);

    const result = await run(root, "resolve", "explain rate limit ownership pseudonymous keys and outage behavior", "--path", "src/auth/login.ts");
    expect(result.code).toBe(0);
    const ids = JSON.parse(result.stdout).items.map((item: { id: string }) => item.id);
    expect(ids).toContain("rate-limit");
    expect(ids).not.toContain("catalog-invariant");
    expect(ids.indexOf("rate-limit")).toBeLessThan(ids.indexOf("architecture"));
  });

  test("treats the root of a recursive path scope as covered", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "auth-scope.md"), `---\nid: auth-scope\nkind: contract\nowner: src/auth\n---\n# Auth scope\n`);
    const result = await run(root, "resolve", "inspect this scope", "--path", "src/auth");
    expect(result.code).toBe(0);
    const ids = JSON.parse(result.stdout).items.map((item: { id: string }) => item.id);
    expect(ids).toContain("authz-invariant");
    expect(ids).toContain("auth-scope");
  });

  test("delivers explicit decision references before unrelated lexical matches", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "decision-0002.md"), `---\nid: decision-0002\nkind: decision\nowner: platform\nadr: ADR-0002\n---\n# Decision\n\nChosen architecture for outage policy.\n`);
    await writeFile(join(root, "dox", "records", "rate-contract.md"), `---\nid: rate-contract\nkind: contract\nowner: platform\nterms: [distributed rate limit]\nadr_refs: [ADR-0002]\n---\n# Rate contract\n\nThe shared package validates pseudonymous keys.\n`);
    for (let index = 0; index < 8; index += 1) {
      await writeFile(join(root, "dox", "records", `distractor-${index}.md`), `---\nid: distractor-${index}\nkind: contract\nowner: platform\nterms: [rate limit]\n---\n# Distractor\n\n${"Unrelated rate limit detail. ".repeat(30)}\n`);
    }

    const result = await run(root, "resolve", "explain distributed rate limit pseudonymous keys and outage policy", "--max-bytes", "2400");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.items.map((item: { id: string }) => item.id)).toContain("decision-0002");
    expect(data.items.find((item: { id: string }) => item.id === "decision-0002").relation).toBe("reference");
  });

  test("rejects stale receipts and undiscovered expansion ids", async () => {
    const root = await project();
    const first = JSON.parse((await run(root, "resolve", "inspect login authorization", "--path", "src/auth/login.ts")).stdout);
    const unknown = await run(root, "resolve", "--from", first.receipt.id, "--expand", "not-discovered");
    expect(unknown.code).toBe(1);
    expect(unknown.stderr).toContain("DOX_EXPANSION_NOT_DISCOVERED");

    const receiptPath = join(root, ".dox", "cache", "receipts", `${first.receipt.id}.json`);
    const receiptText = await readFile(receiptPath, "utf8");
    const tampered = JSON.parse(receiptText);
    tampered.delivered.push("forged-record");
    await writeFile(receiptPath, `${JSON.stringify(tampered)}\n`);
    const forged = await run(root, "resolve", "--from", first.receipt.id, "--expand", "forged-record");
    expect(forged.code).toBe(1);
    expect(forged.stderr).toContain("DOX_RECEIPT_INVALID");
    await writeFile(receiptPath, receiptText);

    await writeFile(join(root, "dox", "records", "login.md"), `---\nid: login\nkind: contract\nowner: identity\npaths: src/auth/login.ts\n---\n# Changed login\n`);
    const stale = await run(root, "resolve", "--from", first.receipt.id, "--expand", "login");
    expect(stale.code).toBe(1);
    expect(stale.stderr).toContain("DOX_RECEIPT_STALE");
  });

  test("rejects a symlinked receipt cache", async () => {
    const root = await project();
    await mkdir(join(root, ".dox", "cache"), { recursive: true });
    await symlink(join(root, "src"), join(root, ".dox", "cache", "receipts"));
    const result = await run(root, "resolve", "inspect login authorization", "--path", "src/auth/login.ts");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("symlink escape denied");
  });

  test("fails atomically when mandatory invariant context exceeds the budget", async () => {
    const root = await project();
    const checks = Array.from({ length: 120 }, (_, index) => `verification-command-${index}`);
    await writeFile(join(root, "dox", "records", "large-invariant.md"), `---\nid: large-invariant\nkind: invariant\nowner: security\nstatement: Login authorization keeps every required check.\nstate: enforced\nenforcement: [chokepoint]\nimpact: security\ncriticality: critical\nenforced_by:\n  - path: src/auth/**\ndepended_on_by:\n  - path: src/api.ts\nverification: ${JSON.stringify(checks)}\nfailure_modes: [bypass]\n---\n# Large invariant\n`);
    const result = await run(root, "resolve", "change login authorization", "--path", "src/auth/login.ts", "--max-bytes", "1024");
    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("DOX_BUDGET_TOO_SMALL");
  });

  test("uses an explicit changed-file base and rejects legacy resolve options", async () => {
    const root = await project();
    await writeFile(join(root, "src", "auth", "login.ts"), "export const authorize = () => false;\n");
    const changed = await run(root, "resolve", "review changed authorization", "--changed", "--base", "HEAD");
    expect(changed.code).toBe(0);
    const evidence = JSON.parse(changed.stdout).items.flatMap((item: { evidence: Array<{ source: string }> }) => item.evidence);
    expect(evidence.some((item: { source: string }) => item.source === "changed-path")).toBe(true);
    const explicit = await run(root, "resolve", "review changed authorization", "--path", "src/auth/login.ts");
    expect(explicit.code).toBe(0);
    expect(JSON.parse(changed.stdout).receipt.id).not.toBe(JSON.parse(explicit.stdout).receipt.id);

    const baseWithoutChanged = await run(root, "resolve", "review authorization", "--base", "HEAD");
    expect(baseWithoutChanged.code).toBe(1);
    expect(baseWithoutChanged.stderr).toContain("--base requires --changed");
    for (const option of ["--json", "--query", "--intent", "--symbol", "--term"]) {
      const legacy = await run(root, "resolve", "review authorization", option, "legacy");
      expect(legacy.code).toBe(1);
      expect(legacy.stderr).toContain(`unknown option: ${option}`);
    }
  });

  test("uses owner scopes for configured path coverage", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "owner-only.md"), `---\nid: owner-only\nkind: ownership\nowner: src/owned\n---\n# Owned scope\n`);
    await writeFile(join(root, "dox", "records", "api.md"), `---\nid: api\nkind: contract\nowner: platform\npaths: src/api.ts\n---\n# API\n`);
    await mkdir(join(root, "src", "owned"), { recursive: true });
    await writeFile(join(root, "src", "owned", "file.ts"), "export const owned = true;\n");
    const result = await run(root, "resolve", "inspect the owned scope", "--path", "src/owned/file.ts");
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout).items.map((item: { id: string }) => item.id)).toContain("owner-only");
    const linted = await run(root, "lint", "--json");
    expect(linted.code).toBe(0);
    expect(JSON.parse(linted.stdout).diagnostics).toEqual([]);
  });

  test("keeps every explicit graph reference discoverable", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "referencing.md"), `---\nid: referencing\nkind: contract\nowner: src/references\npaths: src/references/**\nadr_refs: [ADR-0002, ADR-0003]\n---\n# Referencing contract\n`);
    for (const number of [2, 3]) await writeFile(join(root, "dox", "records", `decision-${number}.md`), `---\nid: decision-${number}\nkind: decision\nowner: platform\nadr: ADR-000${number}\n---\n# Decision ${number}\n`);
    const result = await run(root, "resolve", "inspect this scope", "--path", "src/references/file.ts", "--max-bytes", "2048");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    const discovered = new Set([...data.items.map((item: { id: string }) => item.id), ...data.receipt.deferred]);
    expect(discovered.has("decision-2")).toBe(true);
    expect(discovered.has("decision-3")).toBe(true);
  });

  test("replaces receipt files atomically without changing hardlink targets", async () => {
    const root = await project();
    const args = ["resolve", "inspect login authorization", "--path", "src/auth/login.ts"];
    const first = JSON.parse((await run(root, ...args)).stdout);
    const receiptPath = join(root, ".dox", "cache", "receipts", `${first.receipt.id}.json`);
    const sentinel = join(root, "sentinel.txt");
    await link(receiptPath, sentinel);
    await writeFile(sentinel, "sentinel-content\n");
    const repeated = await run(root, ...args);
    expect(repeated.code).toBe(0);
    expect(await readFile(sentinel, "utf8")).toBe("sentinel-content\n");
  });
});
