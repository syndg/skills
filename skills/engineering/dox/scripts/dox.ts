#!/usr/bin/env bun
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gitRoot, changedPaths } from "./lib/git.ts";
import { lint } from "./lib/lint.ts";
import { loadConfig, loadRecords } from "./lib/records.ts";
import { markdown, publicRecord, receipt, resolve, type Cues } from "./lib/resolve.ts";
import { DoxError, globMatches } from "./lib/safe.ts";

const VERSION = "0.1.0";
const HELP = `DOX ${VERSION}\n\nUsage:\n  dox init [--apply]\n  dox search <term> [--json]\n  dox resolve --path <path> [--path <path>] [--intent <intent>] [--symbol <symbol>] [--term <term>] [--adr <adr>] [--changed [base]] [--json]\n  dox lint [--json]\n\nCommands discover the current Git root. init only writes when --apply is present.`;

function takeValues(args: string[], flag: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flag) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new DoxError(`${flag} requires a value`);
      values.push(value); index += 1;
    }
  }
  return values;
}

function has(args: string[], flag: string) { return args.includes(flag); }

function unknown(args: string[], accepted: string[]) {
  for (let index = 0; index < args.length; index += 1) {
    if (args[index].startsWith("--") && !accepted.includes(args[index])) throw new DoxError(`unknown option: ${args[index]}`);
  }
}

async function init(root: string, apply: boolean) {
  const config = join(root, "dox.config.json");
  const files = [
    "dox.config.json",
    ".dox/.gitignore",
    ".dox/cache/ (ignored)",
    "dox/migration-manifest.json",
    "dox/records/.gitkeep",
  ];
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

async function query(root: string, cues: Cues, json: boolean) {
  const config = await loadConfig(root);
  const { records } = await loadRecords(root, config);
  const matches = resolve(records, cues);
  for (const path of cues.paths) {
    const covered = records.some((record) => [...record.paths, ...((record.kind === "invariant" && ["accepted", "enforced"].includes(record.state ?? "")) ? record.enforced_by.map((edge) => edge.path).filter(Boolean) as string[] : [])].some((pattern) => globMatches(pattern, path)));
    if (config.coverage?.paths?.some((pattern) => globMatches(pattern, path)) && !covered) {
      throw new DoxError(`uncovered path: ${path}`);
    }
  }
  if (json) console.log(JSON.stringify({ records: matches.map(publicRecord), receipt: receipt(matches) }, null, 2));
  else process.stdout.write(markdown(matches));
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h" || command === "help") { console.log(HELP); return; }
  if (command === "--version" || command === "-v" || command === "version") { console.log(VERSION); return; }
  const root = await gitRoot();
  if (command === "init") {
    unknown(args, ["--apply"]);
    await init(root, has(args, "--apply")); return;
  }
  if (command === "search") {
    unknown(args, ["--json"]);
    const term = args.find((arg) => !arg.startsWith("--"));
    if (!term) throw new DoxError("search requires a term");
    await query(root, { paths: [], intents: [], symbols: [], terms: [term], adrs: [] }, has(args, "--json")); return;
  }
  if (command === "resolve") {
    unknown(args, ["--path", "--intent", "--symbol", "--term", "--adr", "--changed", "--json"]);
    const paths = takeValues(args, "--path");
    const changedIndex = args.indexOf("--changed");
    if (changedIndex >= 0) {
      const base = args[changedIndex + 1] && !args[changedIndex + 1].startsWith("--") ? args[changedIndex + 1] : undefined;
      paths.push(...await changedPaths(root, base));
    }
    const cues = { paths, intents: takeValues(args, "--intent"), symbols: takeValues(args, "--symbol"), terms: takeValues(args, "--term"), adrs: takeValues(args, "--adr") };
    if (Object.values(cues).every((values) => values.length === 0) && changedIndex < 0) throw new DoxError("resolve requires a cue or --changed");
    await query(root, cues, has(args, "--json")); return;
  }
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
