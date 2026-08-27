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

  test("distinguishes weak task binding metadata from strong exact symbols", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "weak-binding.md"), `---\nid: weak-binding\nkind: invariant\nowner: deployment\nstatement: Deployment evidence remains durable.\nsymbols: [test]\nterms: [test]\nstate: enforced\nenforcement: [test]\nenforced_by:\n  - intent: test\ndepended_on_by:\n  - path: src/deployment/**\nverification: [bun test]\nfailure_modes: [deployment-drift]\nimpact: deployment\ncriticality: high\n---\n# Deployment evidence\n`);
    await writeFile(join(root, "dox", "records", "strong-binding.md"), `---\nid: strong-binding\nkind: invariant\nowner: deployment\nstatement: Deployment writes remain guarded.\nstate: enforced\nenforcement: [chokepoint]\nenforced_by:\n  - symbol: GuardedDeploymentWriter\ndepended_on_by:\n  - path: src/deployment/**\nverification: [bun test]\nfailure_modes: [unguarded-write]\nimpact: deployment\ncriticality: high\n---\n# Guarded deployment writes\n`);
    await writeFile(join(root, "dox", "records", "generic-binding.md"), `---\nid: generic-binding\nkind: invariant\nowner: evaluation\nstatement: Candidate evidence remains canonical.\nterms: [evaluation]\nstate: enforced\nenforcement: [test]\nenforced_by:\n  - path: src/unrelated/**\ndepended_on_by:\n  - path: src/unrelated-consumer/**\nverification: [bun test]\nfailure_modes: [evidence-drift]\nimpact: unrelated\ncriticality: high\n---\n# Evidence policy\n`);
    await writeFile(join(root, "dox", "records", "oauth-symbol.md"), `---\nid: oauth-symbol\nkind: contract\nowner: auth\nsymbols: [OAuth]\n---\n# OAuth symbol\n`);
    await writeFile(join(root, "dox", "records", "deploy-intent.md"), `---\nid: deploy-intent\nkind: contract\nowner: deployment\nintents: [deploy]\n---\n# Deploy intent\n`);

    const weak = await run(root, "resolve", "test tooltip");
    expect(weak.code).toBe(0);
    expect(JSON.parse(weak.stdout).items.map((item: { id: string }) => item.id)).not.toContain("weak-binding");
    const strong = await run(root, "resolve", "inspect GuardedDeploymentWriter");
    expect(strong.code).toBe(0);
    expect(JSON.parse(strong.stdout).items.map((item: { id: string }) => item.id)).toContain("strong-binding");
    const generic = await run(root, "resolve", "inspect candidate evaluation evidence");
    expect(generic.code).toBe(0);
    expect(JSON.parse(generic.stdout).items.map((item: { id: string }) => item.id)).not.toContain("generic-binding");
    const exactSingletons = await run(root, "resolve", "inspect OAuth behavior and deploy changes in this longer implementation task");
    expect(exactSingletons.code).toBe(0);
    const exactSingletonIds = JSON.parse(exactSingletons.stdout).items.map((item: { id: string }) => item.id);
    expect(exactSingletonIds).toContain("oauth-symbol");
    expect(exactSingletonIds).toContain("deploy-intent");
  });

  test("keeps weak lexical invariant matches out of mandatory task-only context", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "playground-invariant.md"), `---\nid: playground-invariant\nkind: invariant\nowner: playground\nstatement: Every GenQ Playground run has one causally fenced outcome.\nterms: [GenQ Playground]\nstate: enforced\nenforcement: [test]\nenforced_by:\n  - path: src/playground/**\ndepended_on_by:\n  - path: src/evaluation/**\nverification: [bun test]\nfailure_modes: [duplicate-outcome]\nimpact: playground\ncriticality: high\n---\n# Playground outcome\n`);
    for (let index = 0; index < 20; index += 1) {
      await writeFile(join(root, "dox", "records", `weak-${index}.md`), `---\nid: weak-${index}\nkind: invariant\nowner: unrelated\nstatement: Candidate workflow evidence remains canonical for subsystem ${index}.\nstate: accepted\nenforcement: [test]\nenforced_by:\n  - path: src/unrelated/${index}/**\ndepended_on_by:\n  - path: src/unrelated-consumer/${index}/**\nverification: [bun test]\nfailure_modes: [evidence-drift]\nimpact: unrelated\ncriticality: high\n---\n# Candidate workflow evidence\n\nCandidate evaluation evidence remains durable and canonical.\n`);
    }

    const result = await run(root, "resolve", "explain GenQ Playground candidate overlays submission evaluation and recruiter evidence", "--max-bytes", "3000");
    expect(result.code).toBe(0);
    const ids = JSON.parse(result.stdout).items.map((item: { id: string }) => item.id);
    expect(ids).toContain("playground-invariant");
    expect(ids.some((id: string) => id.startsWith("weak-"))).toBe(false);
  });

  test("ranks task-relevant broad path policy before unrelated narrow owner records", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "frontend-testing.md"), `---\nid: frontend-testing\nkind: contract\nowner: platform\nstatement: Frontend testing\npaths: "**"\ncriticality: high\n---\n# Frontend testing\n\nFor tooltip copy, test observable behavior and accessibility instead of utility classes.\n`);
    for (let index = 0; index < 20; index += 1) {
      await writeFile(join(root, "dox", "records", `local-${index}.md`), `---\nid: local-${index}\nkind: contract\nowner: src/auth\n---\n# Local ${index}\n\nUnrelated local guidance.\n`);
    }

    const result = await run(root, "resolve", "plan clarifying tooltip copy", "--path", "src/auth/login.ts", "--max-bytes", "3000");
    expect(result.code).toBe(0);
    const ids = JSON.parse(result.stdout).items.map((item: { id: string }) => item.id);
    expect(ids).toContain("frontend-testing");
  });

  test("does not treat long task boilerplate as binding invariant evidence", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "implementation-policy.md"), `---\nid: implementation-policy\nkind: contract\nowner: platform\nstatement: Frontend testing\npaths: "**"\nintents: [implementation-plan]\n---\n# Frontend testing\n\nTest observable behavior and accessibility instead of utility classes.\n`);
    for (let index = 0; index < 10; index += 1) {
      await writeFile(join(root, "dox", "records", `boilerplate-${index}.md`), `---\nid: boilerplate-${index}\nkind: invariant\nowner: apps/unrelated/src/services\nstatement: Review run files remain verified for subsystem ${index}.\nstate: enforced\nenforcement: [test]\nenforced_by:\n  - path: src/unrelated/${index}/**\ndepended_on_by:\n  - path: src/unrelated-consumer/${index}/**\nverification: [bun test]\nfailure_modes: [unrelated-drift]\nimpact: unrelated\ncriticality: high\n---\n# Review run files\n\nExpected owner, applicable decisions and invariants, relevant symbols and files, obligations, prohibited behavior, read-only verification, clarification, and implementation remain recorded.\n`);
    }

    const task = "After-run seeded-edit review: produce an implementation plan only for clarifying tooltip copy in apps/resumatch/src/components/InfoIcon.tsx. Identify expected owner, applicable decisions and invariants, relevant symbols and files, obligations, prohibited behavior, read-only verification commands, needed clarification, and do not implement or modify files.";
    const result = await run(root, "resolve", task, "--path", "src/components/InfoIcon.tsx");
    expect(result.code).toBe(0);
    const ids = JSON.parse(result.stdout).items.map((item: { id: string }) => item.id);
    expect(ids).toEqual(["implementation-policy"]);
  });

  test("does not promote graph invariants from an unselected lower exact tier", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "relevant-decision.md"), `---\nid: relevant-decision\nkind: decision\nowner: platform\nadr: ADR-0002\n---\n# Relevant decision\n`);
    await writeFile(join(root, "dox", "records", "exact-source.md"), `---\nid: exact-source\nkind: contract\nowner: platform\nintents: [implementation-plan]\nadr_refs: [ADR-0002]\n---\n# Exact policy\n`);
    await writeFile(join(root, "dox", "records", "lower-source.md"), `---\nid: lower-source\nkind: contract\nowner: unrelated\nterms: [tooltip copy]\n---\n# Lower source\n`);
    await writeFile(join(root, "dox", "records", "unrelated-invariant.md"), `---\nid: unrelated-invariant\nkind: invariant\nowner: unrelated\nstatement: Lower-source effects remain fenced.\nstate: enforced\nenforcement: [test]\nenforced_by:\n  - path: src/unrelated/**\ndepended_on_by:\n  - contract: lower-source\nverification: [bun test]\nfailure_modes: [unrelated-drift]\nimpact: unrelated\ncriticality: high\n---\n# Unrelated invariant\n`);

    const result = await run(root, "resolve", "produce an implementation plan for tooltip copy", "--max-bytes", "8192");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.items.map((item: { id: string }) => item.id)).toEqual(["exact-source", "relevant-decision"]);
    expect(data.receipt.deferred).toContain("lower-source");
    expect(data.receipt.deferred).toContain("unrelated-invariant");
  });

  test("keeps binding graph closure for an authoritative path when an unrelated exact source exists", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "exact-symbol.md"), `---\nid: exact-symbol\nkind: contract\nowner: platform\nsymbols: [OAuth]\n---\n# OAuth\n`);
    for (let index = 0; index < 80; index += 1) {
      await writeFile(join(root, "dox", "records", `a-exact-${index}.md`), `---\nid: a-exact-${index}\nkind: contract\nowner: unrelated\nsymbols: [OAuth]\n---\n# Exact noise ${index}\n`);
    }
    await writeFile(join(root, "dox", "records", "path-contract.md"), `---\nid: path-contract\nkind: contract\nowner: src/auth\npaths: src/auth/**\n---\n# Auth path contract\n`);
    await writeFile(join(root, "dox", "records", "path-invariant.md"), `---\nid: path-invariant\nkind: invariant\nowner: auth\nstatement: Auth path effects remain fenced.\nstate: enforced\nenforcement: [test]\nenforced_by:\n  - path: src/enforcement/**\ndepended_on_by:\n  - contract: path-contract\nverification: [bun test]\nfailure_modes: [unfenced-auth-effect]\nimpact: auth\ncriticality: high\n---\n# Auth path invariant\n`);
    const result = await run(root, "resolve", "inspect OAuth", "--path", "src/auth/login.ts");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.items.map((item: { id: string }) => item.id)).toContain("path-invariant");
    expect(data.items.find((item: { id: string }) => item.id === "path-invariant").relation).toBe("dependent");
    expect(data.receipt.binding_complete).toBe(true);
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
    await writeFile(join(root, "dox", "records", "decision-0003.md"), `---\nid: decision-0003\nkind: decision\nowner: platform\nadr: ADR-0003\n---\n# Decision\n\nChosen architecture for pseudonymous keys.\n`);
    await writeFile(join(root, "dox", "records", "rate-contract.md"), `---\nid: rate-contract\nkind: contract\nowner: platform\nterms: [distributed rate limit]\nadr_refs: [ADR-0002, ADR-0003]\n---\n# Rate contract\n\nThe shared package validates pseudonymous keys.\n`);
    for (let index = 0; index < 8; index += 1) {
      await writeFile(join(root, "dox", "records", `distractor-${index}.md`), `---\nid: distractor-${index}\nkind: contract\nowner: platform\nterms: [rate limit]\n---\n# Distractor\n\n${"Unrelated rate limit detail. ".repeat(30)}\n`);
    }

    const result = await run(root, "resolve", "explain distributed rate limit pseudonymous keys and outage policy", "--max-bytes", "2400");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.items.map((item: { id: string }) => item.id)).toContain("decision-0002");
    expect(data.items.map((item: { id: string }) => item.id)).toContain("decision-0003");
    expect(data.items.map((item: { id: string }) => item.id).indexOf("rate-contract")).toBeLessThan(data.items.map((item: { id: string }) => item.id).indexOf("decision-0002"));
    const firstDistractor = data.items.findIndex((item: { id: string }) => item.id.startsWith("distractor-"));
    expect(firstDistractor === -1 || data.items.findIndex((item: { id: string }) => item.id === "decision-0002") < firstDistractor).toBe(true);
    expect(firstDistractor === -1 || data.items.findIndex((item: { id: string }) => item.id === "decision-0003") < firstDistractor).toBe(true);
    expect(data.items.find((item: { id: string }) => item.id === "decision-0002").relation).toBe("reference");
  });

  test("keeps an exact one-token symbol and its graph references ahead of generic terms", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "decision-0002.md"), `---\nid: decision-0002\nkind: decision\nowner: platform\nadr: ADR-0002\n---\n# Decision 2\n`);
    await writeFile(join(root, "dox", "records", "decision-0003.md"), `---\nid: decision-0003\nkind: decision\nowner: platform\nadr: ADR-0003\n---\n# Decision 3\n`);
    await writeFile(join(root, "dox", "records", "authorization-source.md"), `---\nid: authorization-source\nkind: contract\nowner: platform\npaths: "**"\nsymbols: [authorize]\nadr_refs: [ADR-0002, ADR-0003]\n---\n# Authorization source\n`);
    await writeFile(join(root, "dox", "records", "generic-distractor.md"), `---\nid: generic-distractor\nkind: contract\nowner: platform\nterms: [rate limit]\n---\n# Generic rate limit\n`);

    const result = await run(root, "resolve", "authorize generic rate limit for a longer implementation review", "--max-bytes", "3000");
    expect(result.code).toBe(0);
    const ids = JSON.parse(result.stdout).items.map((item: { id: string }) => item.id);
    expect(ids).toContain("decision-0002");
    expect(ids).toContain("decision-0003");
    expect(ids.indexOf("authorization-source")).toBeLessThan(ids.indexOf("decision-0002"));
    expect(ids).not.toContain("generic-distractor");
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
    const references = Array.from({ length: 70 }, (_, index) => index + 2);
    const adrRefs = references.map((number) => `ADR-${String(number).padStart(4, "0")}`).join(", ");
    await writeFile(join(root, "dox", "records", "referencing.md"), `---\nid: referencing\nkind: contract\nowner: src/references\npaths: src/references/**\nadr_refs: [${adrRefs}]\n---\n# Referencing contract\n`);
    for (const number of references) await writeFile(join(root, "dox", "records", `decision-${number}.md`), `---\nid: decision-${number}\nkind: decision\nowner: platform\nadr: ADR-${String(number).padStart(4, "0")}\n---\n# Decision ${number}\n`);
    for (let index = 0; index < 80; index += 1) {
      await writeFile(join(root, "dox", "records", `reference-noise-${index}.md`), `---\nid: reference-noise-${index}\nkind: contract\nowner: src/references\npaths: src/references/**\n---\n# Scope guidance ${index}\n`);
    }
    const result = await run(root, "resolve", "inspect this scope", "--path", "src/references/file.ts", "--max-bytes", "4096");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    const discovered = new Set([...data.items.map((item: { id: string }) => item.id), ...data.receipt.deferred]);
    expect(references.every((number) => discovered.has(`decision-${number}`))).toBe(true);
    expect([...discovered].some((id) => id.startsWith("reference-noise-"))).toBe(true);
    expect(data.receipt.deferred.some((id: string) => id.startsWith("decision-"))).toBe(true);
    expect(data.items.some((item: { id: string }) => item.id.startsWith("reference-noise-"))).toBe(false);
  });

  test("uses task-relevant exact metadata to select a compact supporting excerpt", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "source.md"), `---\nid: source\nkind: contract\nowner: platform\nsymbols: [PlaygroundRuntime]\ncontract_refs: [supporting]\n---\n# Source\n`);
    await writeFile(join(root, "dox", "records", "supporting.md"), `---\nid: supporting\nkind: contract\nowner: platform\nterms: [GenQ Playground]\n---\n# Supporting contract\n\nRuntime provisioning for GenQ remains documented.\n\nGenQ Playground initializes the mutable run-state revisions to zero.\n`);
    const result = await run(root, "resolve", "explain PlaygroundRuntime and GenQ Playground runtime provisioning", "--max-bytes", "8192");
    expect(result.code).toBe(0);
    const item = JSON.parse(result.stdout).items.find((candidate: { id: string }) => candidate.id === "supporting");
    expect(item.excerpt).toContain("revisions to zero");
  });

  test("keeps an explicit graph reference discoverable when it also has direct evidence beyond the cap", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "exact-source.md"), `---\nid: exact-source\nkind: contract\nowner: platform\nterms: [contracts, invariants, verification]\ncontract_refs: [z-supporting-contract]\n---\n# Exact source\n`);
    await writeFile(join(root, "dox", "records", "z-supporting-contract.md"), `---\nid: z-supporting-contract\nkind: contract\nowner: platform\nterms: [runtime]\n---\n# Supporting contract\n\nReview contracts, invariants, and verification for runtime. Initialize the mutable run-state revisions to zero.\n`);
    for (let index = 0; index < 80; index += 1) {
      await writeFile(join(root, "dox", "records", `a-direct-noise-${String(index).padStart(2, "0")}.md`), `---\nid: a-direct-noise-${String(index).padStart(2, "0")}\nkind: contract\nowner: platform\nterms: [runtime, provisioning, workflow]\n---\n# Direct noise ${index}\n`);
    }
    const result = await run(root, "resolve", "review contracts invariants verification for runtime provisioning workflow", "--max-bytes", "4096");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    const discovered = new Set([...data.items.map((item: { id: string }) => item.id), ...data.receipt.deferred]);
    expect(discovered).toContain("z-supporting-contract");
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
