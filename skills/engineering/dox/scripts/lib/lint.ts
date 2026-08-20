import { readFile, realpath } from "node:fs/promises";
import { basename, join } from "node:path";
import type { Config, Diagnostic, Record as DoxRecord } from "./types.ts";
import { trackedFiles } from "./git.ts";
import { linkTarget, loadRecords } from "./records.ts";
import { globMatches } from "./safe.ts";

function add(diagnostics: Diagnostic[], level: Diagnostic["level"], message: string, file?: string) {
  diagnostics.push({ level, message, file });
}

function links(body: string): string[] {
  return [...body.matchAll(/!?\[[^\]]*\]\(([^ )]+)(?:\s+[^)]*)?\)/gu)].map((match) => match[1]);
}

async function containsSymbol(root: string, files: string[], pattern: string | undefined, symbol: string): Promise<boolean> {
  const candidates = files.filter((file) => !file.endsWith(".md") && (!pattern || globMatches(pattern, file)));
  const found = await Promise.all(candidates.map(async (file) => (await readFile(join(root, file), "utf8")).includes(symbol)));
  return found.some(Boolean);
}

export async function lint(root: string, config: Config): Promise<Diagnostic[]> {
  const loaded = await loadRecords(root, config, true);
  const diagnostics = [...loaded.diagnostics];
  const records = loaded.records;
  const files = await trackedFiles(root);
  const byId = new Map<string, DoxRecord>();
  const recordAdrs = new Map<string, DoxRecord>();
  const contracts = new Set<string>();

  for (const file of files.filter((file) => basename(file) === "DECISIONS.md")) {
    add(diagnostics, "error", "parallel ADR source found; migrate decisions into DOX records", file);
  }

  for (const record of records) {
    if (byId.has(record.id)) add(diagnostics, "error", `duplicate id: ${record.id}`, record.file);
    else byId.set(record.id, record);
    if (record.adr) {
      if (recordAdrs.has(record.adr)) add(diagnostics, "error", `duplicate ADR record: ${record.adr}`, record.file);
      else recordAdrs.set(record.adr, record);
    }
    record.terms.filter((term) => term.startsWith("contract:")).forEach((term) => contracts.add(term.slice("contract:".length)));
    record.contracts.forEach((contract) => contracts.add(contract));
    if (!record.owner) add(diagnostics, "error", "missing owner", record.file);
    if (config.owners && record.owner && !config.owners.includes(record.owner)) add(diagnostics, "error", `unknown owner: ${record.owner}`, record.file);

    if (record.kind === "invariant") {
      if (record.state === "enforced" && record.enforced_by.length === 0) add(diagnostics, "error", "enforced invariant without enforcement target", record.file);
      for (const edge of record.enforced_by) {
        if (!edge.path) add(diagnostics, "error", "missing invariant enforcement target", record.file);
        else if (!files.some((file) => globMatches(edge.path!, file))) add(diagnostics, "error", `missing invariant enforcement target: ${edge.path}`, record.file);
        if (edge.symbol && !(await containsSymbol(root, files, edge.path, edge.symbol))) add(diagnostics, "error", `stale enforcement symbol: ${edge.symbol}`, record.file);
      }
      for (const edge of record.depended_on_by) {
        if (edge.path && !files.some((file) => globMatches(edge.path!, file))) add(diagnostics, "error", `empty invariant dependency path: ${edge.path}`, record.file);
      }
    }
  }

  const knownAdrs = new Set(recordAdrs.keys());
  for (const record of records) {
    for (const ref of record.adr_refs) if (!knownAdrs.has(ref)) add(diagnostics, "error", `broken ADR reference: ${ref}`, record.file);
    for (const ref of record.contract_refs) if (!contracts.has(ref) && !byId.has(ref)) add(diagnostics, "error", `broken contract reference: ${ref}`, record.file);
    for (const edge of record.depended_on_by) if (edge.contract && !contracts.has(edge.contract) && byId.get(edge.contract)?.kind !== "contract") {
      add(diagnostics, "error", `broken invariant dependency contract: ${edge.contract}`, record.file);
    }
  }

  for (const record of records) {
    for (const href of links(record.body)) {
      try {
        const target = linkTarget(root, record.file, href);
        if (!target) continue;
        if (!(await Bun.file(target).exists())) { add(diagnostics, "error", `broken Markdown reference: ${href}`, record.file); continue; }
        const real = await realpath(target);
        const rootReal = await realpath(root);
        if (!real.startsWith(`${rootReal}/`) && real !== rootReal) add(diagnostics, "error", `symlink escape denied: ${href}`, record.file);
      } catch (error) { add(diagnostics, "error", error instanceof Error ? error.message : "broken Markdown reference", record.file); }
    }
    for (const symbol of record.symbols) {
      const patterns = record.paths.length ? record.paths : [undefined];
      if (!(await Promise.any(patterns.map(async (pattern) => (await containsSymbol(root, files, pattern, symbol)) || Promise.reject())).catch(() => false))) {
        add(diagnostics, "error", `stale symbol: ${symbol}`, record.file);
      }
    }
  }

  if (config.coverage?.paths) {
    for (const target of config.coverage.paths) {
      for (const file of files.filter((file) => globMatches(target, file))) {
        const covered = records.some((record) => [...record.paths, ...((record.kind === "invariant" && ["accepted", "enforced"].includes(record.state ?? "")) ? record.enforced_by.map((edge) => edge.path).filter(Boolean) as string[] : [])].some((pattern) => globMatches(pattern, file)));
        if (!covered) add(diagnostics, "error", `uncovered path: ${file}`);
      }
    }
  }
  return diagnostics.sort((a, b) => `${a.level}:${a.file ?? ""}:${a.message}`.localeCompare(`${b.level}:${b.file ?? ""}:${b.message}`));
}
