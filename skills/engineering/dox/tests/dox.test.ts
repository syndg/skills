import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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
  const root = await mkdtemp("/tmp/dox-test-"); roots.push(root);
  await git(root, "init", "-q");
  await git(root, "config", "user.email", "test@example.test");
  await git(root, "config", "user.name", "DOX Test");
  await mkdir(join(root, "dox", "records"), { recursive: true });
  await mkdir(join(root, "src", "auth"), { recursive: true });
  await writeFile(join(root, "dox.config.json"), '{"records_dir":"dox/records"}\n');
  await writeFile(join(root, "src", "auth", "login.ts"), "export const authorize = () => true;\n");
  await writeFile(join(root, "src", "api.ts"), "export const api = 1;\n");
  await writeFile(join(root, "dox", "records", "architecture.md"), `---
id: architecture
kind: decision
owner: platform
paths: src/**
terms: [boundary]
aliases: [edge]
adr: ADR-001
source_path: AGENTS.md
source_heading: Ownership
source_sha256: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
source_digest: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789
---
# Architecture
`);
  await writeFile(join(root, "dox", "records", "login.md"), `---
id: login
kind: record
owner: identity
paths: src/auth/login.ts
symbols: [authorize]
intents: [signin]
---
# Login
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

describe("public DOX CLI", () => {
  test("init is explicit and does not create an invariant ledger", async () => {
    const root = await mkdtemp("/tmp/dox-init-"); roots.push(root); await git(root, "init", "-q");
    const dry = await run(root, "init");
    expect(dry.code).toBe(0); expect(dry.stdout).toContain("dry-run"); expect(await Bun.file(join(root, "dox.config.json")).exists()).toBe(false);
    const applied = await run(root, "init", "--apply");
    expect(applied.code).toBe(0); expect(await Bun.file(join(root, "dox", "migration-manifest.json")).exists()).toBe(true);
    expect(await Bun.file(join(root, "dox", "invariants.md")).exists()).toBe(false);
    expect(await Bun.file(join(root, ".dox", ".gitignore")).exists()).toBe(true);
  });

  test("resolves exact paths before broad paths and aliases", async () => {
    const root = await project();
    const result = await run(root, "resolve", "--path", "src/auth/login.ts", "--json");
    expect(result.code).toBe(0); const data = JSON.parse(result.stdout);
    expect(data.records[0].id).toBe("login");
    const alias = await run(root, "search", "edge", "--json");
    expect(JSON.parse(alias.stdout).records[0].id).toBe("architecture");
    expect(JSON.parse(alias.stdout).records[0].source).toEqual({
      path: "AGENTS.md", heading: "Ownership",
      sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      digest: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
    });
  });

  test("uses changed paths and emits a deterministic receipt", async () => {
    const root = await project();
    await writeFile(join(root, "src", "auth", "login.ts"), "export const authorize = () => false;\n");
    const one = await run(root, "resolve", "--changed", "--json");
    const two = await run(root, "resolve", "--changed", "--json");
    expect(one.code).toBe(0); expect(one.stdout).toBe(two.stdout);
    const data = JSON.parse(one.stdout); expect(data.receipt.some((item: { edge: string }) => item.edge.startsWith("enforcement:"))).toBe(true);
  });

  test("returns full invariant bindings and dependent summaries", async () => {
    const root = await project();
    const enforced = JSON.parse((await run(root, "resolve", "--path", "src/auth/login.ts", "--json")).stdout);
    expect(enforced.records.find((item: { id: string }) => item.id === "authz-invariant").verification).toEqual(["bun test"]);
    const dependent = JSON.parse((await run(root, "resolve", "--path", "src/api.ts", "--json")).stdout);
    const invariant = dependent.records.find((item: { id: string }) => item.id === "authz-invariant");
    expect(invariant.match).toBe("dependent"); expect(invariant.summary).toContain("guarded writer");
    expect(dependent.receipt.some((item: { edge: string }) => item.edge.startsWith("dependency:"))).toBe(true);
  });

  test("lint reports duplicate ADRs and stale Markdown references", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "duplicate.md"), `---
id: duplicate
kind: decision
owner: platform
adr: ADR-001
paths: [src/api.ts]
symbols: [retiredSymbol]
---
[missing](nope.md)
`);
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "DECISIONS.md"), "### ADR-0099 — First body\n");
    await writeFile(join(root, "docs", "DECISIONS.md"), "### ADR-0099 — Second body\n");
    await git(root, "add", "DECISIONS.md", "docs/DECISIONS.md");
    const result = await run(root, "lint", "--json");
    expect(result.code).toBe(1); const messages = JSON.parse(result.stdout).diagnostics.map((item: { message: string }) => item.message);
    expect(messages).toContain("duplicate ADR record: ADR-001"); expect(messages).toContain("duplicate ADR body: ADR-0099");
    expect(messages).toContain("broken Markdown reference: nope.md"); expect(messages).toContain("stale symbol: retiredSymbol");
  });

  test("requires explicit project initialization", async () => {
    const root = await mkdtemp("/tmp/dox-no-config-"); roots.push(root); await git(root, "init", "-q");
    const result = await run(root, "resolve", "--path", "src/file.ts", "--json");
    expect(result.code).toBe(1); expect(result.stderr).toContain("dox.config.json not found");
  });

  test("fails closed on traversal", async () => {
    const root = await project();
    const result = await run(root, "resolve", "--path", "../outside", "--json");
    expect(result.code).toBe(1); expect(result.stderr).toContain("unsafe path");
  });
});
