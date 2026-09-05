import { readFile, realpath } from "node:fs/promises";
import { basename, join } from "node:path";
import type { Config, Diagnostic, Record as DoxRecord } from "./types.ts";
import { indexTrackedFiles, trackedFiles } from "./git.ts";
import { brokenContractReferences, duplicateContractDeclarations, linkTarget, loadRecords, pathHasContext } from "./records.ts";
import { globMatches } from "./safe.ts";

function add(diagnostics: Diagnostic[], level: Diagnostic["level"], message: string, file?: string) {
  diagnostics.push({ level, message, file });
}

function links(body: string): string[] {
  return [...body.matchAll(/!?\[[^\]]*\]\(([^ )]+)(?:\s+[^)]*)?\)/gu)].map((match) => match[1]);
}

function visibleMarkdownLines(markdown: string): string[] {
  const visible: string[] = [];
  let inComment = false;
  let fence: { marker: string; length: number } | undefined;

  for (const rawLine of markdown.split(/\r?\n/u)) {
    if (fence) {
      const closer = /^\s{0,3}(`+|~+)[ \t]*$/u.exec(rawLine);
      if (closer && closer[1][0] === fence.marker && closer[1].length >= fence.length) fence = undefined;
      continue;
    }

    let rest = rawLine;
    let line = "";
    while (rest) {
      if (inComment) {
        const end = rest.indexOf("-->");
        if (end === -1) { rest = ""; break; }
        inComment = false;
        rest = rest.slice(end + 3);
        continue;
      }
      const start = rest.indexOf("<!--");
      if (start === -1) { line += rest; break; }
      line += rest.slice(0, start);
      inComment = true;
      rest = rest.slice(start + 4);
    }

    const opener = /^\s{0,3}(`{3,}|~{3,})(.*)$/u.exec(line);
    if (opener && (opener[1][0] === "~" || !opener[2].includes("`"))) {
      fence = { marker: opener[1][0], length: opener[1].length };
      continue;
    }
    visible.push(line);
  }
  return visible;
}

function explicitDoxPointer(body: string): boolean {
  const text = body.trim().replace(/^(?:[-+*]|\d+[.)]|>)\s+/u, "");
  const links = [...text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/gu)];
  const referencesDox = /\bDOX\b/iu.test(text) || links.some((match) => /(?:^|\/)dox(?:\/|$)/iu.test(match[2]));
  if (!referencesDox) return false;
  return /^(?:see|read|resolve|refer to)\b/iu.test(text)
    || /^\[[^\]]+\]\([^)]+\)[.,;:]?$/u.test(text);
}

function hasArchitecturalDecisionEntry(markdown: string): boolean {
  let sectionLevel: number | undefined;
  let headingEntry: { level: number; body: string[] } | undefined;

  const finishHeading = (): boolean => {
    if (!headingEntry) return false;
    const body = headingEntry.body.map((line) => line.trim()).filter(Boolean);
    headingEntry = undefined;
    return body.length === 0 || !body.every(explicitDoxPointer);
  };

  for (const line of visibleMarkdownLines(markdown)) {
    const heading = /^\s{0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/u.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].replace(/[\*_`]/gu, "").trim();
      if (headingEntry && level <= headingEntry.level && finishHeading()) return true;
      if (/^Architectural Decisions$/iu.test(text)) {
        sectionLevel = level;
        continue;
      }
      if (sectionLevel !== undefined && level <= sectionLevel) {
        sectionLevel = undefined;
        continue;
      }
      if (sectionLevel !== undefined && /^ADR-\d{4}\s+(?:—|–|-)\s+\S/iu.test(text)) {
        headingEntry = { level, body: [] };
        continue;
      }
      if (headingEntry) headingEntry.body.push(line);
      continue;
    }

    if (sectionLevel === undefined) continue;
    const boldEntry = /^\s{0,3}[-+*]\s+\*\*ADR-\d{4}\s+(?:—|–|-)\s+(.+?):\*\*\s+(.+)$/iu.exec(line);
    const plainEntry = /^\s{0,3}[-+*]\s+ADR-\d{4}\s+(?:—|–|-)\s+(.+):\s+(.+)$/iu.exec(line);
    const body = boldEntry?.[2] ?? plainEntry?.[2];
    if (body) {
      if (headingEntry && finishHeading()) return true;
      if (!explicitDoxPointer(body)) return true;
      continue;
    }
    if (headingEntry) headingEntry.body.push(line);
  }
  return finishHeading();
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
  const indexedFiles = await indexTrackedFiles(root);
  const byId = new Map<string, DoxRecord>();
  const recordAdrs = new Map<string, DoxRecord>();

  for (const file of files.filter((file) => basename(file) === "DECISIONS.md")) {
    add(diagnostics, "error", "parallel ADR source found; migrate decisions into DOX records", file);
  }
  for (const file of indexedFiles.filter((file) => basename(file) === "AGENTS.md")) {
    if (hasArchitecturalDecisionEntry(await readFile(join(root, file), "utf8"))) {
      add(diagnostics, "error", "parallel ADR source found; migrate decisions into DOX records", file);
    }
  }

  for (const record of records) {
    if (byId.has(record.id)) add(diagnostics, "error", `duplicate id: ${record.id}`, record.file);
    else byId.set(record.id, record);
    if (record.adr) {
      if (record.kind !== "decision") add(diagnostics, "error", `ADR requires kind decision: ${record.adr}`, record.file);
      else if (recordAdrs.has(record.adr)) add(diagnostics, "error", `duplicate ADR record: ${record.adr}`, record.file);
      else recordAdrs.set(record.adr, record);
    }
    if (!record.owner) add(diagnostics, "error", "missing owner", record.file);
    if (config.owners && record.owner && !config.owners.includes(record.owner)) add(diagnostics, "error", `unknown owner: ${record.owner}`, record.file);

    if (record.kind === "invariant") {
      if (record.state === "enforced" && record.enforced_by.length === 0) add(diagnostics, "error", "enforced invariant without enforcement target", record.file);
      for (const edge of record.enforced_by) {
        if (edge.path && !files.some((file) => globMatches(edge.path!, file))) add(diagnostics, "error", `missing invariant enforcement target: ${edge.path}`, record.file);
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
  }
  for (const duplicate of duplicateContractDeclarations(records)) {
    add(diagnostics, "error", duplicate.message, duplicate.record.file);
  }
  for (const broken of brokenContractReferences(records)) {
    add(diagnostics, "error", broken.message, broken.record.file);
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
        const covered = pathHasContext(records, config, file);
        if (!covered) add(diagnostics, "error", `uncovered path: ${file}`);
      }
    }
  }
  return diagnostics.sort((a, b) => `${a.level}:${a.file ?? ""}:${a.message}`.localeCompare(`${b.level}:${b.file ?? ""}:${b.message}`));
}
