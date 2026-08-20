import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import type { Config, Diagnostic, Record as DoxRecord } from "./types.ts";
import { asBindings, asStrings, DoxError, isInside, safeGlob, safeRelative } from "./safe.ts";

const DEFAULT_RECORDS_DIR = "dox/records";
const ENFORCEMENT_KINDS = new Set(["database", "type", "chokepoint", "test", "lint", "prose"]);
export async function loadConfig(root: string): Promise<Config> {
  const configPath = join(root, "dox.config.json");
  let configStat: Awaited<ReturnType<typeof lstat>>;
  try { configStat = await lstat(configPath); } catch { throw new DoxError("dox.config.json not found; run dox init --apply explicitly"); }
  if (configStat.isSymbolicLink()) throw new DoxError("symlink escape denied: dox.config.json");
  let parsed: unknown;
  try { parsed = JSON.parse(await Bun.file(configPath).text()); } catch { throw new DoxError("invalid dox.config.json"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new DoxError("invalid dox.config.json");
  const raw = parsed as Record<string, unknown>;
  const records_dir = raw.records_dir === undefined ? DEFAULT_RECORDS_DIR : raw.records_dir;
  if (typeof records_dir !== "string") throw new DoxError("invalid records_dir");
  safeRelative(records_dir, "records_dir");
  const config: Config = { records_dir };
  if (raw.owners !== undefined) config.owners = asStrings(raw.owners, "owners");
  if (raw.coverage !== undefined) {
    if (!raw.coverage || typeof raw.coverage !== "object" || Array.isArray(raw.coverage)) throw new DoxError("invalid coverage");
    const paths = asStrings((raw.coverage as Record<string, unknown>).paths, "coverage.paths");
    paths.forEach((path) => safeGlob(path, "coverage.paths"));
    config.coverage = { paths };
  }
  return config;
}

function frontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u.exec(text);
  if (!match) throw new DoxError("missing YAML frontmatter");
  let data: unknown;
  try { data = Bun.YAML.parse(match[1]); } catch (error) { throw new DoxError(`invalid YAML: ${error instanceof Error ? error.message : "parse failure"}`); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new DoxError("frontmatter must be an object");
  return { data: data as Record<string, unknown>, body: match[2] };
}

export function parseRecord(text: string, file: string): DoxRecord {
  const { data, body } = frontmatter(text);
  const id = asStrings(data.id, "id", true)[0];
  const kind = asStrings(data.kind, "kind")[0] ?? "record";
  const owners = asStrings(data.owner, "owner");
  if (owners.length > 1) throw new DoxError("ambiguous owner");
  const adr = asStrings(data.adr, "adr")[0];
  const record: DoxRecord = {
    id, kind, owner: owners[0],
    statement: asStrings(data.statement, "statement")[0],
    paths: asStrings(data.paths, "paths").map((path) => safeGlob(path, "paths")),
    intents: asStrings(data.intents ?? data.intent, "intents"),
    symbols: asStrings(data.symbols ?? data.symbol, "symbols"),
    terms: asStrings(data.terms ?? data.term, "terms"),
    aliases: asStrings(data.aliases ?? data.alias, "aliases"),
    adr,
    adr_refs: asStrings(data.adr_refs, "adr_refs"),
    contracts: asStrings(data.contracts ?? data.contract, "contracts"),
    contract_refs: asStrings(data.contract_refs, "contract_refs"),
    depends_on: asBindings(data.depends_on, "depends_on"),
    enforced_by: asBindings(data.enforced_by, "enforced_by"),
    depended_on_by: asBindings(data.depended_on_by, "depended_on_by"),
    enforcement: asStrings(data.enforcement, "enforcement"),
    verification: asStrings(data.verification, "verification"),
    failure_modes: asStrings(data.failure_modes, "failure_modes"),
    impact: asStrings(data.impact, "impact")[0],
    criticality: asStrings(data.criticality, "criticality")[0],
    state: asStrings(data.state, "state")[0],
    source_path: asStrings(data.source_path, "source_path")[0],
    source_heading: asStrings(data.source_heading, "source_heading")[0],
    source_sha256: asStrings(data.source_sha256, "source_sha256")[0],
    source_digest: asStrings(data.source_digest, "source_digest")[0],
    body, file,
  };
  for (const kind of record.enforcement) if (!ENFORCEMENT_KINDS.has(kind)) throw new DoxError(`invalid enforcement kind: ${kind}`);
  if (record.kind === "invariant" && !record.owner) throw new DoxError("invariant is missing owner");
  return record;
}

async function markdownFiles(directory: string, root: string): Promise<string[]> {
  let directoryStat: Awaited<ReturnType<typeof lstat>>;
  try { directoryStat = await lstat(directory); } catch { return []; }
  if (directoryStat.isSymbolicLink()) throw new DoxError(`symlink escape denied: ${relative(root, directory)}`);
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(directory, entry.name);
    const stat = await lstat(full);
    if (stat.isSymbolicLink()) throw new DoxError(`symlink escape denied: ${relative(root, full)}`);
    if (stat.isDirectory()) files.push(...await markdownFiles(full, root));
    else if (stat.isFile() && entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

export async function loadRecords(root: string, config: Config, tolerateMalformed = false): Promise<{ records: DoxRecord[]; diagnostics: Diagnostic[] }> {
  const rootReal = await realpath(root);
  const recordsDirectory = resolve(root, config.records_dir);
  if (!isInside(rootReal, recordsDirectory)) throw new DoxError("records directory escapes git root");
  const records: DoxRecord[] = [];
  const diagnostics: Diagnostic[] = [];
  for (const full of await markdownFiles(recordsDirectory, rootReal)) {
    const real = await realpath(full);
    const file = relative(root, real).replaceAll("\\", "/");
    if (!isInside(rootReal, real)) throw new DoxError(`symlink escape denied: ${file}`);
    try { records.push(parseRecord(await readFile(real, "utf8"), file)); }
    catch (error) {
      if (!tolerateMalformed) throw new DoxError(`${file}: ${error instanceof Error ? error.message : "malformed record"}`);
      diagnostics.push({ level: "error", file, message: error instanceof Error ? error.message : "malformed record" });
    }
  }
  return { records: records.sort((a, b) => a.id.localeCompare(b.id)), diagnostics };
}

export function recordPath(root: string, record: DoxRecord): string {
  return join(root, record.file);
}

export function linkTarget(root: string, file: string, href: string): string | undefined {
  if (href.startsWith("#") || /^[a-z]+:\/\//iu.test(href) || href.startsWith("mailto:")) return undefined;
  const cleaned = href.split("#")[0].split("?")[0];
  if (!cleaned) return undefined;
  const base = resolve(root, dirname(file));
  const target = resolve(base, cleaned);
  if (!isInside(root, target)) throw new DoxError(`unsafe Markdown reference: ${href}`);
  return target;
}
