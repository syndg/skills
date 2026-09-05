#!/usr/bin/env bun
import { lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { gitRoot, changedPaths } from "./lib/git.ts";
import { lint } from "./lib/lint.ts";
import { loadConfig, loadRecords, pathHasContext } from "./lib/records.ts";
import { expandContext, resolveContext } from "./lib/resolve.ts";
import { DoxError, globMatches } from "./lib/safe.ts";
import type { Config, ReceiptManifest, Record as DoxRecord, ResolveRequest } from "./lib/types.ts";

const VERSION = "0.3.0";
const DEFAULT_BUDGET = 16_384;
const DEFAULT_BRIEF_BUDGET = 131_072;
const DEFAULT_EXPANSION_BUDGET = 65_536;
const HELP = `DOX ${VERSION}

Usage:
  dox init [--apply]
  dox brief --path <path>... [--changed] [--base <revision>] [--max-bytes <bytes>] [--json]
  dox resolve <subject> [--path <path>]... [--changed] [--base <revision>] [--max-bytes <bytes>] [--json]
  dox resolve --from <receipt> --expand <record-id>... [--max-bytes <bytes>] [--json]
  dox lint [--json]
  dox <command> --help

brief delivers full curated standing context, applicable invariant tuples, and an ADR index.
Scopes inherit root-to-nearest. Missing scopes fail explicitly without lexical fallback.
resolve retrieves additional named or domain context; paths select applicable change context.
Default output is wrapped text. --json selects the structured envelope.
Full ADR bodies and deferred records require receipt-backed --from/--expand.
Required context never truncates: a budget error reports the required byte count.
Default budgets: ${DEFAULT_BRIEF_BUDGET} bytes for brief, ${DEFAULT_BUDGET} for named resolve, ${DEFAULT_EXPANSION_BUDGET} for expansion.
Exit 1 means invalid configuration, missing scope, stale receipt, or insufficient budget.`;

type ResolveArgs = {
  task?: string;
  paths: string[];
  changed: boolean;
  base?: string;
  from?: string;
  expansions: string[];
  budgetBytes?: number;
  json: boolean;
};

function has(args: string[], flag: string) { return args.includes(flag); }

function unknown(args: string[], accepted: string[]) {
  for (let index = 0; index < args.length; index += 1) {
    if (args[index].startsWith("--") && !accepted.includes(args[index])) throw new DoxError(`DOX_USAGE: unknown option: ${args[index]}`);
  }
}

function parseResolve(args: string[], brief = false): ResolveArgs {
  const parsed: ResolveArgs = { paths: [], changed: false, expansions: [], json: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--changed") { parsed.changed = true; continue; }
    if (arg === "--json") { parsed.json = true; continue; }
    if (["--path", "--base", "--from", "--expand", "--max-bytes"].includes(arg)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new DoxError(`DOX_USAGE: ${arg} requires a value`);
      index += 1;
      if (arg === "--path") parsed.paths.push(value);
      else if (arg === "--base") parsed.base = value;
      else if (arg === "--from") parsed.from = value;
      else if (arg === "--expand") parsed.expansions.push(value);
      else {
        const budget = Number(value);
        if (!Number.isSafeInteger(budget) || budget < 1024) throw new DoxError("DOX_USAGE: invalid output budget");
        parsed.budgetBytes = budget;
      }
      continue;
    }
    if (arg.startsWith("--")) throw new DoxError(`DOX_USAGE: unknown option: ${arg}`);
    if (brief || parsed.task !== undefined) throw new DoxError(brief ? "DOX_USAGE: brief accepts paths, not a subject" : "DOX_USAGE: resolve accepts one subject");
    parsed.task = arg;
  }
  if (parsed.base && !parsed.changed) throw new DoxError("DOX_USAGE: --base requires --changed");
  if (parsed.from || parsed.expansions.length) {
    if (brief) throw new DoxError("DOX_USAGE: use resolve for receipt expansion");
    if (!parsed.from || !parsed.expansions.length) throw new DoxError("DOX_USAGE: --from and --expand must be used together");
    if (parsed.task || parsed.paths.length || parsed.changed || parsed.base) throw new DoxError("DOX_USAGE: expansion cannot include retrieval cues");
  } else if (!brief && !parsed.task?.trim()) throw new DoxError("DOX_USAGE: resolve requires one subject");
  if (brief && !parsed.paths.length && !parsed.changed) throw new DoxError("DOX_USAGE: brief requires --path or --changed");
  return parsed;
}

async function init(root: string, apply: boolean) {
  const config = join(root, "dox.config.json");
  const files = ["dox.config.json", ".dox/.gitignore", ".dox/cache/ (ignored)", "dox/migration-manifest.json", "dox/records/.gitkeep"];
  const proposal = ["DOX initialization proposal", `root: ${root}`, "create:", ...files.map((file) => `- ${file}`), "does not create an invariant ledger", apply ? "action: apply" : "action: dry-run (pass --apply to write)"];
  console.log(proposal.join("\n"));
  if (!apply) return;
  if (await Bun.file(config).exists()) throw new DoxError("dox.config.json already exists; refusing to replace it");
  await mkdir(join(root, "dox", "records"), { recursive: true });
  await mkdir(join(root, ".dox", "cache"), { recursive: true });
  await writeFile(config, `${JSON.stringify({ schema_version: 1, records_dir: "dox/records" }, null, 2)}\n`);
  await writeFile(join(root, ".dox", ".gitignore"), "*\n!.gitignore\n");
  await writeFile(join(root, "dox", "migration-manifest.json"), `${JSON.stringify({ version: 1, records: [] }, null, 2)}\n`);
  await writeFile(join(root, "dox", "records", ".gitkeep"), "");
}

async function ensureDirectory(path: string): Promise<void> {
  try {
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new DoxError(`symlink escape denied: ${path}`);
    if (!stat.isDirectory()) throw new DoxError(`receipt cache is not a directory: ${path}`);
  } catch (error) {
    if (error instanceof DoxError) throw error;
    await mkdir(path);
  }
}

async function receiptDirectory(root: string): Promise<string> {
  const dox = join(root, ".dox");
  const cache = join(dox, "cache");
  const receipts = join(cache, "receipts");
  await ensureDirectory(dox);
  await ensureDirectory(cache);
  await ensureDirectory(receipts);
  return receipts;
}

async function saveReceipt(root: string, manifest: ReceiptManifest): Promise<void> {
  const directory = await receiptDirectory(root);
  const path = join(directory, `${manifest.id}.json`);
  try {
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new DoxError(`symlink escape denied: .dox/cache/receipts/${manifest.id}.json`);
  } catch (error) {
    if (error instanceof DoxError) throw error;
  }
  const temporary = join(directory, `.${manifest.id}.${process.pid}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, `${JSON.stringify(manifest)}\n`, { flag: "wx", mode: 0o600 });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function loadReceipt(root: string, id: string): Promise<ReceiptManifest> {
  if (!/^[a-f0-9]{64}$/u.test(id)) throw new DoxError("DOX_RECEIPT_UNKNOWN: invalid receipt id");
  const directory = await receiptDirectory(root);
  const path = join(directory, `${id}.json`);
  let stat: Awaited<ReturnType<typeof lstat>>;
  try { stat = await lstat(path); } catch { throw new DoxError(`DOX_RECEIPT_UNKNOWN: ${id}`); }
  if (stat.isSymbolicLink() || !stat.isFile()) throw new DoxError(`symlink escape denied: .dox/cache/receipts/${id}.json`);
  let parsed: unknown;
  try { parsed = JSON.parse(await readFile(path, "utf8")); } catch { throw new DoxError(`DOX_RECEIPT_UNKNOWN: ${id}`); }
  if (!parsed || typeof parsed !== "object" || (parsed as { id?: unknown }).id !== id || (parsed as { version?: unknown }).version !== 2) throw new DoxError(`DOX_RECEIPT_UNKNOWN: ${id}`);
  return parsed as ReceiptManifest;
}

function checkCoverage(records: DoxRecord[], config: Config, paths: string[]): void {
  for (const path of paths) {
    if (config.coverage?.paths?.some((pattern) => globMatches(pattern, path)) && !pathHasContext(records, config, path)) {
      throw new DoxError(`uncovered path: ${path}`);
    }
  }
}

async function resolve(root: string, args: string[], brief = false): Promise<void> {
  const parsed = parseResolve(args, brief);
  const config = await loadConfig(root);
  const { records } = await loadRecords(root, config);
  if (parsed.from) {
    const prior = await loadReceipt(root, parsed.from);
    const result = expandContext(records, prior, parsed.expansions, parsed.budgetBytes ?? DEFAULT_EXPANSION_BUDGET, config.scopes, parsed.json ? "json" : "text");
    await saveReceipt(root, result.manifest);
    process.stdout.write(result.output);
    return;
  }

  const paths = [...parsed.paths];
  const pathSources: NonNullable<ResolveRequest["pathSources"]> = Object.fromEntries(paths.map((path) => [path, "path"]));
  if (parsed.changed) for (const path of await changedPaths(root, parsed.base)) {
    paths.push(path); pathSources[path] = "changed-path";
  }
  if (!brief) checkCoverage(records, config, paths);
  const result = resolveContext(records, {
    task: parsed.task ?? "", paths, pathSources, scopes: config.scopes,
    mode: brief ? "brief" : "resolve", format: parsed.json ? "json" : "text",
    budgetBytes: parsed.budgetBytes ?? (brief ? DEFAULT_BRIEF_BUDGET : DEFAULT_BUDGET),
  });
  await saveReceipt(root, result.manifest);
  process.stdout.write(result.output);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h" || command === "help") { console.log(HELP); return; }
  if (command === "--version" || command === "-v" || command === "version") { console.log(VERSION); return; }
  if (["init", "brief", "resolve", "lint"].includes(command) && (has(args, "--help") || has(args, "-h"))) { console.log(HELP); return; }
  const root = await gitRoot();
  if (command === "init") { unknown(args, ["--apply"]); await init(root, has(args, "--apply")); return; }
  if (command === "resolve" || command === "brief") { await resolve(root, args, command === "brief"); return; }
  if (command === "lint") {
    unknown(args, ["--json"]);
    const diagnostics = await lint(root, await loadConfig(root));
    if (has(args, "--json")) console.log(JSON.stringify({ diagnostics }, null, 2));
    else diagnostics.forEach((item) => console.log(`${item.level.toUpperCase()}${item.file ? ` ${item.file}` : ""}: ${item.message}`));
    if (diagnostics.some((item) => item.level === "error")) process.exitCode = 1;
    return;
  }
  throw new DoxError(`unknown command: ${command}`);
}

main().catch((error) => { console.error(`dox: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
