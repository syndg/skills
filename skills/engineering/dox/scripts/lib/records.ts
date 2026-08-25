import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import type { Config, Diagnostic, Record as DoxRecord } from "./types.ts";
import { asBindings, asStrings, DoxError, isInside, safeGlob, safeRelative } from "./safe.ts";

const DEFAULT_RECORDS_DIR = "dox/records";
const ENFORCEMENT_KINDS = new Set(["database", "type", "chokepoint", "test", "lint", "prose"]);
const RECORD_KINDS = new Set(["record", "decision", "contract", "invariant", "ownership", "term"]);
const INVARIANT_STATES = new Set(["proposed", "accepted", "enforced", "retired"]);
const CONFIG_FIELDS = new Set(["schema_version", "records_dir", "owners", "coverage"]);
const RECORD_FIELDS = new Set([
  "id", "kind", "owner", "statement", "paths", "path", "intents", "intent", "symbols", "symbol", "terms", "term", "aliases", "alias",
  "adr", "adr_refs", "contracts", "contract", "contract_refs", "depends_on", "enforced_by", "depended_on_by", "enforcement", "verification",
  "failure_modes", "impact", "criticality", "state", "source_path", "source_heading", "source_sha256", "source_digest",
]);
function rejectUnknown(data: Record<string, unknown>, allowed: Set<string>, label: string) {
  const unknown = Object.keys(data).filter((key) => !allowed.has(key)).sort();
  if (unknown.length) throw new DoxError(`unknown ${label} field: ${unknown[0]}`);
}
export async function loadConfig(root: string): Promise<Config> {
  const configPath = join(root, "dox.config.json");
  let configStat: Awaited<ReturnType<typeof lstat>>;
  try { configStat = await lstat(configPath); } catch { throw new DoxError("dox.config.json not found; run dox init --apply explicitly"); }
  if (configStat.isSymbolicLink()) throw new DoxError("symlink escape denied: dox.config.json");
  let parsed: unknown;
  try { parsed = JSON.parse(await Bun.file(configPath).text()); } catch { throw new DoxError("invalid dox.config.json"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new DoxError("invalid dox.config.json");
  const raw = parsed as Record<string, unknown>;
  rejectUnknown(raw, CONFIG_FIELDS, "config");
  if (raw.schema_version !== 1) throw new DoxError("unsupported schema_version; expected 1");
  const records_dir = raw.records_dir === undefined ? DEFAULT_RECORDS_DIR : raw.records_dir;
  if (typeof records_dir !== "string") throw new DoxError("invalid records_dir");
  safeRelative(records_dir, "records_dir");
  const config: Config = { schema_version: 1, records_dir };
  if (raw.owners !== undefined) config.owners = asStrings(raw.owners, "owners");
  if (raw.coverage !== undefined) {
    if (!raw.coverage || typeof raw.coverage !== "object" || Array.isArray(raw.coverage)) throw new DoxError("invalid coverage");
    const coverageRaw = raw.coverage as Record<string, unknown>;
    rejectUnknown(coverageRaw, new Set(["paths"]), "coverage");
    const paths = asStrings(coverageRaw.paths, "coverage.paths");
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
  rejectUnknown(data, RECORD_FIELDS, "record");
  const id = asStrings(data.id, "id", true)[0];
  const kind = asStrings(data.kind, "kind")[0] ?? "record";
  if (!RECORD_KINDS.has(kind)) throw new DoxError(`unsupported record kind: ${kind}`);
  const owners = asStrings(data.owner, "owner", true);
  if (owners.length > 1) throw new DoxError("ambiguous owner");
  const adr = asStrings(data.adr, "adr")[0];
  const record: DoxRecord = {
    id, kind, owner: owners[0],
    statement: asStrings(data.statement, "statement")[0],
    paths: asStrings(data.paths ?? data.path, "paths").map((path) => safeGlob(path, "paths")),
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
  if (!body.trim()) throw new DoxError("missing record body");
  if (record.adr && !/^ADR-\d{4}$/u.test(record.adr)) throw new DoxError(`invalid adr: ${record.adr}`);
  for (const field of [record.source_sha256, record.source_digest]) if (field && !/^[a-f0-9]{64}$/u.test(field)) throw new DoxError(`invalid source digest: ${field}`);
  for (const kind of record.enforcement) if (!ENFORCEMENT_KINDS.has(kind)) throw new DoxError(`invalid enforcement kind: ${kind}`);
  if (record.kind === "invariant") {
    if (!record.statement) throw new DoxError("invariant is missing statement");
    if (!record.state || !INVARIANT_STATES.has(record.state)) throw new DoxError("invariant has invalid or missing state");
    if (!record.impact) throw new DoxError("invariant is missing impact");
    if (!record.criticality) throw new DoxError("invariant is missing criticality");
    if (record.failure_modes.length === 0) throw new DoxError("invariant is missing failure modes");
    if (["accepted", "enforced"].includes(record.state)) {
      if (record.depended_on_by.length === 0) throw new DoxError("binding invariant is missing dependency targets");
      if (record.enforcement.length === 0) throw new DoxError("binding invariant is missing enforcement classification");
      if (record.enforced_by.length === 0) throw new DoxError("binding invariant is missing enforcement targets");
      if (record.verification.length === 0) throw new DoxError("binding invariant is missing verification");
    }
  }
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

export type BrokenContractReference = {
  record: DoxRecord;
  relation: "contract_refs" | "depends_on" | "enforced_by" | "depended_on_by";
  contract: string;
  message: string;
};

export function contractDeclarations(record: DoxRecord): string[] {
  const declarations = [
    ...(record.kind === "contract" ? [record.id, ...record.aliases] : []),
    ...record.contracts,
    ...record.terms
      .filter((term) => term.startsWith("contract:") && term.length > "contract:".length)
      .map((term) => term.slice("contract:".length)),
  ];
  return [...new Set(declarations)];
}

export type DuplicateContractDeclaration = {
  record: DoxRecord;
  first: DoxRecord;
  contract: string;
  message: string;
};

export function duplicateContractDeclarations(records: readonly DoxRecord[]): DuplicateContractDeclaration[] {
  const firstByContract = new Map<string, DoxRecord>();
  const duplicates: DuplicateContractDeclaration[] = [];
  for (const record of records) for (const contract of contractDeclarations(record)) {
    const first = firstByContract.get(contract);
    if (first && first !== record) {
      duplicates.push({ record, first, contract, message: `duplicate contract declaration: ${contract}` });
    } else if (!first) firstByContract.set(contract, record);
  }
  return duplicates;
}

export function brokenContractReferences(records: readonly DoxRecord[]): BrokenContractReference[] {
  const declared = new Set(records.flatMap(contractDeclarations));
  const broken: BrokenContractReference[] = [];
  for (const record of records) {
    for (const contract of record.contract_refs) if (!declared.has(contract)) {
      broken.push({ record, relation: "contract_refs", contract, message: `broken contract reference: ${contract}` });
    }
    for (const relation of ["depends_on", "enforced_by", "depended_on_by"] as const) {
      for (const edge of record[relation]) if (edge.contract && !declared.has(edge.contract)) {
        broken.push({ record, relation, contract: edge.contract, message: `broken ${relation} contract: ${edge.contract}` });
      }
    }
  }
  return broken;
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
  if (!tolerateMalformed) {
    const ids = new Set<string>();
    const adrs = new Set<string>();
    for (const record of records) {
      if (ids.has(record.id)) throw new DoxError(`duplicate id: ${record.id}`);
      ids.add(record.id);
      if (record.adr) {
        if (record.kind !== "decision") throw new DoxError(`ADR requires kind decision: ${record.adr}`);
        if (adrs.has(record.adr)) throw new DoxError(`duplicate ADR record: ${record.adr}`);
        adrs.add(record.adr);
      }
    }
    const duplicateContracts = duplicateContractDeclarations(records);
    if (duplicateContracts.length) throw new DoxError(duplicateContracts[0].message);
    for (const record of records) for (const ref of record.adr_refs) if (!adrs.has(ref)) throw new DoxError(`broken ADR reference: ${ref}`);
    const brokenContracts = brokenContractReferences(records);
    if (brokenContracts.length) throw new DoxError(brokenContracts[0].message);
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
