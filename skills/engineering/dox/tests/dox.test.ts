import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
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
  await writeFile(join(root, "dox.config.json"), '{"schema_version":1,"records_dir":"dox/records","coverage":{"paths":["src/**"]}}\n');
  await writeFile(join(root, "src", "auth", "login.ts"), "export const authorize = () => true;\n");
  await writeFile(join(root, "src", "api.ts"), "export const api = 1;\n");
  await writeFile(join(root, "src", "other.ts"), "export const other = 1;\n");
  await writeFile(join(root, "dox", "records", "architecture.md"), `---
id: architecture
kind: decision
owner: platform
paths: src/**
terms: [boundary]
aliases: [edge]
adr: ADR-0001
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

  test("ranks narrow paths before broad paths and cuts over legacy search", async () => {
    const root = await project();
    const result = await run(root, "resolve", "inspect login boundary edge ADR-0001", "--path", "src/auth/login.ts");
    expect(result.code).toBe(0); const data = JSON.parse(result.stdout);
    const ids = data.items.map((item: { id: string }) => item.id);
    expect(ids.indexOf("login")).toBeLessThan(ids.indexOf("architecture"));
    expect(data.items.find((item: { id: string }) => item.id === "architecture").source).toEqual({
      path: "AGENTS.md", heading: "Ownership",
      sha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      digest: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
    });
    const legacy = await run(root, "search", "edge");
    expect(legacy.code).toBe(1); expect(legacy.stderr).toContain("unknown command: search");
  });

  test("uses changed paths and emits a deterministic receipt", async () => {
    const root = await project();
    await writeFile(join(root, "src", "auth", "login.ts"), "export const authorize = () => false;\n");
    await writeFile(join(root, "src", "other.ts"), "export const other = 2;\n");
    const one = await run(root, "resolve", "review changed authorization", "--changed");
    const two = await run(root, "resolve", "review changed authorization", "--changed");
    expect(one.code).toBe(0); expect(one.stdout).toBe(two.stdout);
    const data = JSON.parse(one.stdout);
    expect(data.items.find((item: { id: string }) => item.id === "authz-invariant").evidence.some((item: { edge: string }) => item.edge.startsWith("enforcement:"))).toBe(true);
  });

  test("returns complete invariant bindings and dependent context", async () => {
    const root = await project();
    const enforced = JSON.parse((await run(root, "resolve", "change login authorization", "--path", "src/auth/login.ts")).stdout);
    expect(enforced.items.find((item: { id: string }) => item.id === "authz-invariant").invariant.verification).toEqual(["bun test"]);
    const dependent = JSON.parse((await run(root, "resolve", "inspect API authorization dependency", "--path", "src/api.ts")).stdout);
    const invariant = dependent.items.find((item: { id: string }) => item.id === "authz-invariant");
    expect(invariant.relation).toBe("dependent"); expect(invariant.summary).toContain("guarded writer");
    expect(invariant.evidence.some((item: { edge: string }) => item.edge.startsWith("dependency:"))).toBe(true);
  });

  test("validates and resolves contract dependency bindings", async () => {
    const root = await project();
    const invariantPath = join(root, "dox", "records", "contract-dependent.md");
    const invariant = (contract: string) => `---
id: contract-dependent
kind: invariant
owner: platform
statement: A named contract has a guarded consumer.
state: enforced
enforcement: [test]
impact: cross-module
criticality: high
enforced_by:
  - path: src/auth/login.ts
depended_on_by:
  - contract: ${contract}
verification: [bun test]
failure_modes: [contract-bypass]
---
# Contract dependency
`;
    await writeFile(invariantPath, invariant("missing-contract"));
    const missing = await run(root, "resolve", "inspect missing-contract");
    expect(missing.code).toBe(1); expect(missing.stderr).toContain("broken depended_on_by contract: missing-contract");
    await writeFile(join(root, "dox", "records", "named-contract.md"), `---
id: named-contract
kind: contract
owner: platform
contracts: [known-contract]
paths: [src/contracts/**]
---
# Named contract
`);
    await writeFile(invariantPath, invariant("known-contract"));
    const result = await run(root, "resolve", "inspect known-contract");
    expect(result.code).toBe(0);
    const dependent = JSON.parse(result.stdout).items.find((item: { id: string }) => item.id === "contract-dependent");
    expect(dependent.relation).toBe("dependent");
    const byPath = await run(root, "resolve", "inspect this consumer", "--path", "src/contracts/consumer.ts");
    expect(byPath.code).toBe(0);
    const pathDependent = JSON.parse(byPath.stdout).items.find((item: { id: string }) => item.id === "contract-dependent");
    expect(pathDependent.relation).toBe("dependent");
  });

  test("accepts declared contracts as invariant enforcement targets", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "enforcement-contract.md"), `---
id: enforcement-contract
kind: contract
owner: platform
aliases: [enforcement-alias]
---
# Enforcement contract
`);
    await writeFile(join(root, "dox", "records", "contract-enforced.md"), `---
id: contract-enforced
kind: invariant
owner: platform
statement: The enforcement contract guards the invariant.
state: enforced
enforcement: [chokepoint]
impact: cross-module
criticality: high
enforced_by:
  - contract: enforcement-alias
depended_on_by:
  - path: src/api.ts
verification: [bun test]
failure_modes: [contract-bypass]
---
# Contract enforcement
`);

    const strict = await run(root, "resolve", "inspect enforcement-alias");
    expect(strict.code).toBe(0);
    const invariant = JSON.parse(strict.stdout).items.find((item: { id: string }) => item.id === "contract-enforced");
    expect(invariant.relation).toBe("binding");

    const linted = await run(root, "lint", "--json");
    expect(linted.code).toBe(0);
    expect(JSON.parse(linted.stdout).diagnostics).toEqual([]);
  });

  test("fails closed for every undeclared contract relation", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "ordinary-target.md"), `---
id: ordinary-target
kind: record
owner: platform
---
# Ordinary target
`);
    const cases = [
      { file: "contract-ref.md", field: "contract_refs: [ordinary-target]", message: "broken contract reference: ordinary-target" },
      { file: "depends-on.md", field: "depends_on:\n  - contract: ordinary-target", message: "broken depends_on contract: ordinary-target" },
      { file: "enforced-by.md", field: "enforced_by:\n  - contract: ordinary-target", message: "broken enforced_by contract: ordinary-target" },
      { file: "depended-on-by.md", field: "depended_on_by:\n  - contract: ordinary-target", message: "broken depended_on_by contract: ordinary-target" },
    ];

    for (const item of cases) {
      const path = join(root, "dox", "records", item.file);
      await writeFile(path, `---
id: ${item.file.replace(".md", "")}
kind: record
owner: platform
${item.field}
---
# Invalid contract relation
`);
      const result = await run(root, "resolve", "inspect contract relations");
      expect(result.code).toBe(1);
      expect(result.stderr).toContain(item.message);
      await rm(path);
    }

    for (const item of cases) {
      await writeFile(join(root, "dox", "records", item.file), `---
id: ${item.file.replace(".md", "")}
kind: record
owner: platform
${item.field}
---
# Invalid contract relation
`);
    }
    const linted = await run(root, "lint", "--json");
    expect(linted.code).toBe(1);
    const messages = JSON.parse(linted.stdout).diagnostics.map((item: { message: string }) => item.message);
    for (const item of cases) expect(messages).toContain(item.message);
    for (const item of cases) await rm(join(root, "dox", "records", item.file));

    await writeFile(join(root, "dox", "records", "declared-contract.md"), `---
id: id-contract
kind: contract
owner: platform
contracts: [named-contract]
terms: [contract:term-contract]
---
# Declared contracts
`);
    await writeFile(join(root, "dox", "records", "valid-relations.md"), `---
id: valid-relations
kind: record
owner: platform
contract_refs: [id-contract, named-contract, term-contract]
depends_on:
  - contract: id-contract
  - contract: named-contract
  - contract: term-contract
enforced_by:
  - contract: id-contract
  - contract: named-contract
  - contract: term-contract
depended_on_by:
  - contract: id-contract
  - contract: named-contract
  - contract: term-contract
---
# Valid contract relations
`);
    const validResolve = await run(root, "resolve", "inspect declared contracts");
    expect(validResolve.code).toBe(0);
    const validLint = await run(root, "lint", "--json");
    expect(validLint.code).toBe(0);
  });

  test("lint distinguishes AGENTS decision bodies from explicit DOX pointers and Markdown examples", async () => {
    const root = await project();
    await mkdir(join(root, "packages", "api"), { recursive: true });
    await writeFile(join(root, "AGENTS.md"), `# Agent guidance

## Architectural Decisions

Architectural decisions are stored in DOX. See ADR-0001 in the resolved decision record.

- [ADR-0001 — Existing decision](dox/records/architecture.md)
- **ADR-0002 — Existing decision:** [Resolve the DOX record](dox/records/architecture.md)
- **ADR-0003 — Existing decision:** See the DOX record for the decision body.

### ADR-0004 — Existing heading

- Resolve the DOX record for the decision body.

<!--
### ADR-0096 — Commented example

- **ADR-0097 — Commented: example:** This is sample syntax, not a decision.
-->

\`\`\`\`md
\`\`\`md
### ADR-0098 — Nested fence example
\`\`\`
\`\`\`\`

\`\`\`md
\`\`\`\`ts
### ADR-0099 — Longer info-string fence example
\`\`\`\`
\`\`\`
`);
    await writeFile(join(root, "packages", "api", "AGENTS.md"), `# API guidance

Use the root decisions. For rationale, resolve ADR-0001.
`);
    await git(root, "add", "AGENTS.md", "packages/api/AGENTS.md");

    const harmless = await run(root, "lint", "--json");
    expect(harmless.code).toBe(0);
    expect(JSON.parse(harmless.stdout).diagnostics.some((item: { message: string }) => item.message.includes("parallel ADR source"))).toBe(false);

    await writeFile(join(root, "AGENTS.md"), `# Agent guidance

## Architectural Decisions

- **ADR-0009 — Canonical store:** DOX is the source of truth for architectural decisions.
`);
    const doxDecision = await run(root, "lint", "--json");
    expect(doxDecision.code).toBe(1);
    expect(JSON.parse(doxDecision.stdout).diagnostics).toContainEqual({
      level: "error",
      file: "AGENTS.md",
      message: "parallel ADR source found; migrate decisions into DOX records",
    });

    await writeFile(join(root, "AGENTS.md"), `# Agent guidance

## Architectural Decisions

- **ADR-0010 — Authorization: keep one writer:** See every authorization request through the guarded writer.
`);
    await writeFile(join(root, "packages", "api", "AGENTS.md"), `# API guidance

## Architectural Decisions

### ADR-0011 — Keep the API stateless

Store session state outside the API process.
`);

    const result = await run(root, "lint", "--json");
    expect(result.code).toBe(1);
    const parallelFiles = JSON.parse(result.stdout).diagnostics
      .filter((item: { message: string }) => item.message === "parallel ADR source found; migrate decisions into DOX records")
      .map((item: { file: string }) => item.file);
    expect(parallelFiles).toEqual(["AGENTS.md", "packages/api/AGENTS.md"]);
  });

  test("decision-ledger lint ignores untracked AGENTS.md until it enters the index", async () => {
    const root = await project();
    await writeFile(join(root, "AGENTS.md"), `## Architectural Decisions

- **ADR-0012 — Keep writes centralized:** Route writes through one chokepoint.
`);
    await writeFile(join(root, "src", "untracked.ts"), "export const untrackedSignal = true;\n");
    await writeFile(join(root, "dox", "records", "untracked-source.md"), `---
id: untracked-source
kind: record
owner: platform
paths: [src/untracked.ts]
symbols: [untrackedSignal]
---
# Untracked source
`);

    const untracked = await run(root, "lint", "--json");
    expect(untracked.code).toBe(0);
    expect(JSON.parse(untracked.stdout).diagnostics.some((item: { message: string }) => item.message.includes("parallel ADR source"))).toBe(false);

    await git(root, "add", "AGENTS.md");
    const indexed = await run(root, "lint", "--json");
    expect(indexed.code).toBe(1);
    expect(JSON.parse(indexed.stdout).diagnostics).toContainEqual({
      level: "error",
      file: "AGENTS.md",
      message: "parallel ADR source found; migrate decisions into DOX records",
    });
  });

  test("decision-ledger lint rejects untracked DECISIONS.md files", async () => {
    const root = await project();
    await writeFile(join(root, "DECISIONS.md"), `# Decisions

### ADR-0013 — Keep writes centralized

Route writes through one chokepoint.
`);

    const result = await run(root, "lint", "--json");
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).diagnostics).toContainEqual({
      level: "error",
      file: "DECISIONS.md",
      message: "parallel ADR source found; migrate decisions into DOX records",
    });
  });

  test("ADR declarations and references accept decision records only", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "not-a-decision.md"), `---
id: not-a-decision
kind: contract
owner: platform
adr: ADR-0002
---
# Not a decision
`);
    await writeFile(join(root, "dox", "records", "bad-adr-ref.md"), `---
id: bad-adr-ref
kind: record
owner: platform
adr_refs: [ADR-0002]
---
# Bad ADR reference
`);

    const strict = await run(root, "resolve", "inspect ADR-0002");
    expect(strict.code).toBe(1);
    expect(strict.stderr).toContain("ADR requires kind decision: ADR-0002");

    const linted = await run(root, "lint", "--json");
    expect(linted.code).toBe(1);
    const messages = JSON.parse(linted.stdout).diagnostics.map((item: { message: string }) => item.message);
    expect(messages).toContain("ADR requires kind decision: ADR-0002");
    expect(messages).toContain("broken ADR reference: ADR-0002");
  });

  test("contract declarations are unique across records but may repeat within one record", async () => {
    const root = await project();
    const collisionCases = [
      {
        name: "id-contract-alias",
        first: "id: id-contract-alias\nkind: contract",
        second: "id: contract-alias-owner\nkind: record\ncontracts: [id-contract-alias]",
      },
      {
        name: "id-contract-term",
        first: "id: id-contract-term\nkind: contract",
        second: "id: contract-term-owner\nkind: record\nterms: [contract:id-contract-term]",
      },
      {
        name: "record-alias",
        first: "id: alias-owner\nkind: contract\naliases: [record-alias]",
        second: "id: record-alias\nkind: contract",
      },
      {
        name: "alias-contract-term",
        first: "id: term-alias-owner\nkind: contract\naliases: [alias-contract-term]",
        second: "id: term-owner\nkind: record\nterms: [contract:alias-contract-term]",
      },
    ];

    for (const [index, item] of collisionCases.entries()) {
      const first = join(root, "dox", "records", `collision-${index}-a.md`);
      const second = join(root, "dox", "records", `collision-${index}-b.md`);
      await writeFile(first, `---\n${item.first}\nowner: platform\n---\n# First declaration\n`);
      await writeFile(second, `---\n${item.second}\nowner: platform\n---\n# Second declaration\n`);

      const strict = await run(root, "resolve", `inspect ${item.name}`);
      expect(strict.code).toBe(1);
      expect(strict.stderr).toContain(`duplicate contract declaration: ${item.name}`);

      const linted = await run(root, "lint", "--json");
      expect(linted.code).toBe(1);
      expect(JSON.parse(linted.stdout).diagnostics.map((entry: { message: string }) => entry.message))
        .toContain(`duplicate contract declaration: ${item.name}`);
      await rm(first);
      await rm(second);
    }

    await writeFile(join(root, "dox", "records", "self-declared-contract.md"), `---
id: self-contract
kind: contract
owner: platform
aliases: [self-contract, self-alias, self-alias]
contracts: [self-contract, self-alias]
terms: [contract:self-contract, contract:self-alias]
---
# Self-declared contract
`);
    await writeFile(join(root, "dox", "records", "self-contract-ref.md"), `---
id: self-contract-ref
kind: record
owner: platform
contract_refs: [self-alias]
---
# Self contract reference
`);

    const strict = await run(root, "resolve", "inspect self-alias");
    expect(strict.code).toBe(0);
    const linted = await run(root, "lint", "--json");
    expect(linted.code).toBe(0);
  });

  test("lint reports duplicate ADRs and stale Markdown references", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "duplicate.md"), `---
id: duplicate
kind: decision
owner: platform
adr: ADR-0001
paths: [src/api.ts]
symbols: [retiredSymbol]
---
[missing](nope.md)
`);
    const ambiguous = await run(root, "resolve", "inspect ADR-0001");
    expect(ambiguous.code).toBe(1); expect(ambiguous.stderr).toContain("duplicate ADR record: ADR-0001");
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, "DECISIONS.md"), "### ADR-0099 — First body\n");
    await writeFile(join(root, "docs", "DECISIONS.md"), "### ADR-0099 — Second body\n");
    await git(root, "add", "DECISIONS.md", "docs/DECISIONS.md");
    const result = await run(root, "lint", "--json");
    expect(result.code).toBe(1); const messages = JSON.parse(result.stdout).diagnostics.map((item: { message: string }) => item.message);
    expect(messages).toContain("duplicate ADR record: ADR-0001"); expect(messages).toContain("parallel ADR source found; migrate decisions into DOX records");
    expect(messages).toContain("broken Markdown reference: nope.md"); expect(messages).toContain("stale symbol: retiredSymbol");
  });

  test("fails closed on unknown schema fields and incomplete invariants", async () => {
    const root = await project();
    await writeFile(join(root, "dox.config.json"), '{"schema_version":1,"records_dir":"dox/records","mystery":true}\n');
    const unknownConfig = await run(root, "resolve", "inspect api", "--path", "src/api.ts");
    expect(unknownConfig.code).toBe(1); expect(unknownConfig.stderr).toContain("unknown config field: mystery");
    await writeFile(join(root, "dox.config.json"), '{"schema_version":1,"records_dir":"dox/records","coverage":{"paths":["src/**"]}}\n');
    await writeFile(join(root, "dox", "records", "unknown.md"), `---
id: unknown
kind: contract
owner: platform
mystery: true
---
# Unknown
`);
    const unknown = await run(root, "resolve", "inspect api", "--path", "src/api.ts");
    expect(unknown.code).toBe(1); expect(unknown.stderr).toContain("unknown record field: mystery");
    await rm(join(root, "dox", "records", "unknown.md"));
    await writeFile(join(root, "dox", "records", "incomplete.md"), `---
id: incomplete
kind: invariant
owner: platform
---
# Incomplete
`);
    const incomplete = await run(root, "resolve", "inspect api", "--path", "src/api.ts");
    expect(incomplete.code).toBe(1); expect(incomplete.stderr).toContain("invariant is missing statement");
  });

  test("keeps proposed invariants nonbinding", async () => {
    const root = await project();
    await writeFile(join(root, "dox", "records", "proposal.md"), `---
id: proposal
kind: invariant
owner: platform
statement: A possible future guarantee.
paths: [src/api.ts]
enforced_by:
  - path: src/api.ts
failure_modes: [proposal-not-adopted]
impact: local
criticality: low
state: proposed
---
# Proposal
`);
    const result = await run(root, "resolve", "inspect proposed API guarantee", "--path", "src/api.ts");
    expect(result.code).toBe(0);
    const data = JSON.parse(result.stdout);
    const proposal = data.items.find((item: { id: string }) => item.id === "proposal");
    expect(proposal.relation).toBe("proposal");
    expect(proposal.evidence.find((item: { edge: string }) => item.edge === "record.path:src/api.ts").value).toBe("src/api.ts");
  });

  test("requires explicit project initialization", async () => {
    const root = await mkdtemp("/tmp/dox-no-config-"); roots.push(root); await git(root, "init", "-q");
    const result = await run(root, "resolve", "inspect source file", "--path", "src/file.ts");
    expect(result.code).toBe(1); expect(result.stderr).toContain("dox.config.json not found");
  });

  test("fails closed on record symlinks", async () => {
    const root = await project();
    await symlink(join(root, "src", "api.ts"), join(root, "dox", "records", "linked.md"));
    const result = await run(root, "resolve", "inspect API", "--path", "src/api.ts");
    expect(result.code).toBe(1); expect(result.stderr).toContain("symlink escape denied");
  });

  test("fails closed on source symlinks outside the repository", async () => {
    const root = await project();
    const outside = await mkdtemp("/tmp/dox-outside-"); roots.push(outside);
    await writeFile(join(outside, "secret.ts"), "export const sentinel = true;\n");
    await symlink(join(outside, "secret.ts"), join(root, "src", "linked.ts"));
    await writeFile(join(root, "dox", "records", "sentinel.md"), `---
id: sentinel
kind: contract
owner: platform
paths: [src/linked.ts]
symbols: [sentinel]
---
# Sentinel
`);
    const result = await run(root, "lint", "--json");
    expect(result.code).toBe(1); expect(result.stderr).toContain("symlink escape denied");
  });

  test("fails closed on traversal", async () => {
    const root = await project();
    const result = await run(root, "resolve", "inspect outside path", "--path", "../outside");
    expect(result.code).toBe(1); expect(result.stderr).toContain("unsafe path");
  });
});
