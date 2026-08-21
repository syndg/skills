import { createHash } from "node:crypto";
import type {
  Binding,
  ContextItem,
  ReceiptManifest,
  Record as DoxRecord,
  ResolveEnvelope,
  ResolveRequest,
  RetrievalEvidence,
} from "./types.ts";
import { DoxError, globMatches, globSpecificity, ownerScopeMatches, safeRelative } from "./safe.ts";

const RESOLVER_VERSION = 2;
const STOP_WORDS = new Set([
  "a", "an", "and", "about", "change", "find", "for", "from", "how", "in", "into", "is", "of", "on", "or", "repository",
  "review", "show", "task", "that", "the", "this", "to", "what", "where", "which", "with", "without",
]);

type Relation = ContextItem["relation"];
type Candidate = {
  record: DoxRecord;
  relation: Relation;
  evidence: Array<RetrievalEvidence & { priority: number; specificity: number }>;
  graphDepth: number;
  taskHits: number;
  metadataHits: number;
  referenceScore: number;
};

type Resolution = { output: string; envelope: ResolveEnvelope; manifest: ReceiptManifest };
export type Expansion = { output: string; manifest: ReceiptManifest };

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalRecord(record: DoxRecord): object {
  return {
    id: record.id, kind: record.kind, owner: record.owner, statement: record.statement,
    paths: record.paths, intents: record.intents, symbols: record.symbols, terms: record.terms, aliases: record.aliases,
    adr: record.adr, adr_refs: record.adr_refs, contracts: record.contracts, contract_refs: record.contract_refs,
    depends_on: record.depends_on, enforced_by: record.enforced_by, depended_on_by: record.depended_on_by,
    enforcement: record.enforcement, verification: record.verification, failure_modes: record.failure_modes,
    impact: record.impact, criticality: record.criticality, state: record.state,
    source_path: record.source_path, source_heading: record.source_heading, source_sha256: record.source_sha256,
    source_digest: record.source_digest, body: record.body, file: record.file,
  };
}

export function recordRevision(record: DoxRecord): string {
  return hash(JSON.stringify(canonicalRecord(record)));
}

export function corpusRevision(records: readonly DoxRecord[]): string {
  return hash(JSON.stringify(records.map(canonicalRecord)));
}

function validReceiptId(manifest: ReceiptManifest): boolean {
  const { id, ...content } = manifest;
  return id === hash(JSON.stringify(content));
}

function splitWords(value: string): string[] {
  const separated = value.normalize("NFKC").replace(/([\p{Ll}\d])([\p{Lu}])/gu, "$1 $2").toLocaleLowerCase("en-US");
  return [...new Set((separated.match(/[\p{L}\p{N}]+/gu) ?? []).filter((word) => !STOP_WORDS.has(word)))];
}

function phrase(value: string): string {
  return splitWords(value).join(" ");
}

function headings(body: string): string[] {
  return body.split(/\r?\n/u).map((line) => /^#{1,6}\s+(.+)$/u.exec(line)?.[1]?.trim()).filter((line): line is string => Boolean(line));
}

function taskHitCount(record: DoxRecord, taskTokens: Set<string>, includeBody = true): number {
  const fields = [record.id, record.owner ?? "", record.statement ?? "", record.adr ?? "", ...record.contracts, ...record.symbols, ...record.intents, ...record.terms, ...record.aliases, ...headings(record.body)];
  if (includeBody) fields.push(record.body);
  const indexedTokens = new Set(splitWords(fields.join(" ")));
  return [...taskTokens].filter((token) => indexedTokens.has(token)).length;
}

function bindingInvariant(record: DoxRecord): boolean {
  return record.kind === "invariant" && (record.state === "accepted" || record.state === "enforced");
}

function includesPhrase(taskPhrase: string, value: string): boolean {
  const candidate = phrase(value);
  return Boolean(candidate) && (` ${taskPhrase} `).includes(` ${candidate} `);
}

function tokenCoverage(taskTokens: Set<string>, value: string): { hits: number; total: number } {
  const tokens = splitWords(value);
  return { hits: tokens.filter((token) => taskTokens.has(token)).length, total: tokens.length };
}

function sourceForPath(request: ResolveRequest, path: string): "path" | "changed-path" {
  return request.pathSources?.[path] ?? "path";
}

function addEvidence(candidate: Candidate, evidence: RetrievalEvidence, priority: number, specificity = 0): void {
  const key = `${evidence.source}\u0000${evidence.edge}\u0000${evidence.value}`;
  if (candidate.evidence.some((item) => `${item.source}\u0000${item.edge}\u0000${item.value}` === key)) return;
  candidate.evidence.push({ ...evidence, priority, specificity });
}

function directCandidate(record: DoxRecord, request: ResolveRequest): Candidate | undefined {
  const taskPhrase = phrase(request.task);
  const taskTokens = new Set(splitWords(request.task));
  const taskHits = taskHitCount(record, taskTokens);
  const metadataHits = taskHitCount(record, taskTokens, false);
  const candidate: Candidate = { record, relation: record.kind === "invariant" && record.state === "proposed" ? "proposal" : "record", evidence: [], graphDepth: 0, taskHits, metadataHits, referenceScore: 0 };

  for (const path of request.paths) {
    for (const pattern of record.paths) if (globMatches(pattern, path)) {
      const specificity = globSpecificity(pattern);
      const priority = 600 + Math.min(250, Math.max(0, specificity));
      addEvidence(candidate, { source: sourceForPath(request, path), edge: `record.path:${pattern}`, value: path }, priority, specificity);
    }
    const ownerScope = record.owner?.replace(/\/$/u, "");
    if (ownerScopeMatches(record.owner, path) && ownerScope) {
      const specificity = ownerScope.length * 10;
      addEvidence(candidate, { source: sourceForPath(request, path), edge: `record.owner:${ownerScope}`, value: path }, 825, specificity);
    }
    if (bindingInvariant(record)) {
      for (const binding of record.enforced_by) if (binding.path && globMatches(binding.path, path)) {
        candidate.relation = "binding";
        addEvidence(candidate, { source: "binding", edge: `enforcement:${binding.path}`, value: path }, 1000, globSpecificity(binding.path));
      }
      for (const binding of record.depended_on_by) if (binding.path && globMatches(binding.path, path)) {
        if (candidate.relation !== "binding") candidate.relation = "dependent";
        addEvidence(candidate, { source: "binding", edge: `dependency:${binding.path}`, value: path }, 950, globSpecificity(binding.path));
      }
    }
  }

  const metadata: Array<{ edge: string; values: string[]; priority: number; minimumHits: number }> = [
    { edge: "record.identifier", values: [record.id, record.adr ?? "", ...record.contracts], priority: 850, minimumHits: 1 },
    { edge: "record.symbol", values: record.symbols, priority: 800, minimumHits: 1 },
    { edge: "record.intent", values: record.intents, priority: 750, minimumHits: 1 },
    { edge: "record.term", values: [...record.terms, ...record.aliases], priority: 700, minimumHits: 1 },
    { edge: "record.statement", values: record.statement ? [record.statement] : [], priority: 650, minimumHits: Math.min(2, Math.max(1, taskTokens.size)) },
    { edge: "record.heading", values: headings(record.body), priority: 600, minimumHits: Math.min(2, Math.max(1, taskTokens.size)) },
  ];
  for (const field of metadata) for (const value of field.values.filter(Boolean)) {
    const coverage = tokenCoverage(taskTokens, value);
    const exactPhrase = includesPhrase(taskPhrase, value);
    const phraseField = ["record.identifier", "record.term", "record.statement", "record.heading"].includes(field.edge);
    const requiredHits = phraseField && coverage.total > 1 ? Math.min(2, coverage.total, Math.max(1, taskTokens.size)) : field.minimumHits;
    if (exactPhrase || coverage.hits >= requiredHits) {
      addEvidence(candidate, { source: "task", edge: field.edge, value }, field.priority + (exactPhrase ? 20 : 0));
    }
  }

  if (taskTokens.size > 0) {
    const coverage = tokenCoverage(taskTokens, record.body);
    const threshold = Math.min(2, taskTokens.size);
    if (coverage.hits >= threshold) addEvidence(candidate, { source: "task", edge: "record.body", value: `${coverage.hits}/${taskTokens.size} task tokens` }, 500);
  }

  if (bindingInvariant(record)) {
    for (const [edgeKind, bindings, priority] of [["enforcement", record.enforced_by, 980], ["dependency", record.depended_on_by, 940]] as const) {
      for (const binding of bindings) for (const key of ["symbol", "contract", "intent"] as const) {
        const value = binding[key];
        if (value && includesPhrase(taskPhrase, value)) {
          if (edgeKind === "enforcement") candidate.relation = "binding";
          else if (candidate.relation !== "binding") candidate.relation = "dependent";
          addEvidence(candidate, { source: "binding", edge: `${edgeKind}:${value}`, value }, priority);
        }
      }
    }
  }

  return candidate.evidence.length ? candidate : undefined;
}

type GraphLink = { record: DoxRecord; relation: "reference" | "dependent"; source: "graph" | "binding"; edge: string };

function referencedRecords(record: DoxRecord, records: readonly DoxRecord[]): GraphLink[] {
  const byAdr = new Map(records.filter((item) => item.adr).map((item) => [item.adr as string, item]));
  const byContract = new Map<string, DoxRecord>();
  for (const item of records) {
    if (item.kind === "contract") byContract.set(item.id, item);
    for (const contract of item.contracts) byContract.set(contract, item);
    for (const term of item.terms) if (term.startsWith("contract:")) byContract.set(term.slice("contract:".length), item);
  }
  const out = new Map<string, GraphLink>();
  const add = (target: DoxRecord | undefined, relation: GraphLink["relation"], source: GraphLink["source"], edge: string) => {
    if (!target) return;
    const existing = out.get(target.id);
    if (!existing || relation === "dependent") out.set(target.id, { record: target, relation, source, edge });
  };
  for (const adr of record.adr_refs) add(byAdr.get(adr), "reference", "graph", `adr:${adr}`);
  for (const contract of record.contract_refs) add(byContract.get(contract), "reference", "graph", `contract:${contract}`);
  for (const binding of record.depends_on) {
    if (binding.contract) add(byContract.get(binding.contract), "reference", "graph", `depends_on:${binding.contract}`);
    if (binding.symbol) for (const target of records) if (target.symbols.includes(binding.symbol)) add(target, "reference", "graph", `depends_on:${binding.symbol}`);
    if (binding.intent) for (const target of records) if (target.intents.includes(binding.intent)) add(target, "reference", "graph", `depends_on:${binding.intent}`);
    if (binding.path) for (const target of records) if (target.paths.includes(binding.path)) add(target, "reference", "graph", `depends_on:${binding.path}`);
  }
  const declaredContracts = new Set([...(record.kind === "contract" ? [record.id] : []), ...record.contracts, ...record.terms.filter((term) => term.startsWith("contract:")).map((term) => term.slice("contract:".length))]);
  if (declaredContracts.size) for (const target of records) if (bindingInvariant(target)) {
    for (const binding of target.depended_on_by) if (binding.contract && declaredContracts.has(binding.contract)) {
      add(target, "dependent", "binding", `dependency:${binding.contract}`);
    }
  }
  return [...out.values()].sort((left, right) => left.record.id.localeCompare(right.record.id));
}

function addClosure(candidates: Map<string, Candidate>, records: readonly DoxRecord[], task: string): void {
  const taskTokens = new Set(splitWords(task));
  const qualifiesAsSeed = (candidate: Candidate): boolean => {
    const specificity = Math.max(0, ...candidate.evidence.map((item) => item.specificity));
    return bindingInvariant(candidate.record) || specificity >= 100 || candidate.metadataHits >= 2;
  };
  const queue = [...candidates.values()].map((candidate) => ({ candidate, depth: 0 }));
  while (queue.length) {
    const { candidate, depth } = queue.shift() as { candidate: Candidate; depth: number };
    if (depth >= 2) continue;
    const referenced = referencedRecords(candidate.record, records);
    for (const link of referenced) {
      const record = link.record;
      const taskHits = taskHitCount(record, taskTokens);
      const metadataHits = taskHitCount(record, taskTokens, false);
      const sourceSpecificity = Math.max(0, ...candidate.evidence.map((item) => item.specificity));
      const sourceStrong = sourceSpecificity >= 100 || candidate.metadataHits >= 2;
      const referenceScore = referenced.length === 1 && sourceStrong ? 20 + candidate.metadataHits * 10 + candidate.taskHits : metadataHits >= 2 ? metadataHits * 10 : 0;
      const existing = candidates.get(record.id);
      if (existing) {
        if (link.relation === "dependent" && existing.relation !== "binding") existing.relation = "dependent";
        else if (existing.relation === "record") existing.relation = "reference";
        existing.referenceScore = Math.max(existing.referenceScore, referenceScore);
        addEvidence(existing, { source: link.source, edge: link.edge, value: record.id }, 400 - depth * 25);
        continue;
      }
      const relation: Relation = link.relation === "dependent" ? "dependent" : bindingInvariant(record) ? "binding" : "reference";
      const added: Candidate = { record, relation, evidence: [], graphDepth: depth + 1, taskHits, metadataHits, referenceScore };
      addEvidence(added, { source: link.source, edge: link.edge, value: record.id }, 400 - depth * 25);
      candidates.set(record.id, added);
      if (qualifiesAsSeed(added)) queue.push({ candidate: added, depth: depth + 1 });
    }
  }
}

function rank(candidate: Candidate): [number, number, number, number, number, number, number, number] {
  const mandatory = bindingInvariant(candidate.record) ? 1 : 0;
  const best = Math.max(...candidate.evidence.map((item) => item.priority));
  const classes = new Set(candidate.evidence.map((item) => `${item.source}:${item.edge.split(":")[0]}`)).size;
  const specificity = Math.max(0, ...candidate.evidence.map((item) => item.specificity));
  const narrowScope = specificity >= 100 ? 1 : 0;
  return [mandatory, narrowScope, candidate.referenceScore, candidate.metadataHits, candidate.taskHits, best, classes, -candidate.graphDepth];
}

function compareCandidates(left: Candidate, right: Candidate): number {
  const a = rank(left); const b = rank(right);
  for (let index = 0; index < a.length; index += 1) if (a[index] !== b[index]) return b[index] - a[index];
  return left.record.id.localeCompare(right.record.id);
}

function relevantExcerpt(record: DoxRecord, task: string): string {
  const taskTokens = new Set(splitWords(task));
  const paragraphs = record.body.split(/\r?\n\s*\r?\n/u).map((paragraph) => paragraph.trim()).filter(Boolean);
  const prose = paragraphs.filter((paragraph) => !/^#{1,6}\s+/u.test(paragraph));
  const ranked = (prose.length ? prose : paragraphs).map((paragraph) => ({ paragraph, hits: tokenCoverage(taskTokens, paragraph).hits }));
  ranked.sort((left, right) => right.hits - left.hits);
  const selected = ranked[0]?.paragraph.replace(/\s+/gu, " ").trim() ?? record.id;
  if (Buffer.byteLength(selected) <= 1024) return selected;
  const sentences = selected.split(/(?<=[.!?])\s+/u);
  let excerpt = "";
  for (const sentence of sentences) {
    const next = excerpt ? `${excerpt} ${sentence}` : sentence;
    if (Buffer.byteLength(next) > 1024) break;
    excerpt = next;
  }
  return excerpt || headings(record.body)[0] || record.id;
}

function contextItem(candidate: Candidate, task: string): ContextItem {
  const record = candidate.record;
  const source = record.source_path ? { path: record.source_path, heading: record.source_heading, sha256: record.source_sha256, digest: record.source_digest } : undefined;
  const summary = record.statement ?? headings(record.body)[0] ?? record.id;
  const excerpt = bindingInvariant(record) ? undefined : relevantExcerpt(record, task);
  const item: ContextItem = {
    id: record.id, kind: record.kind, owner: record.owner,
    relation: bindingInvariant(record) ? (candidate.relation === "dependent" ? "dependent" : "binding") : candidate.relation,
    summary, file: record.file, source,
    evidence: candidate.evidence.sort((left, right) => right.priority - left.priority || left.edge.localeCompare(right.edge) || left.value.localeCompare(right.value)).map(({ priority: _priority, specificity: _specificity, ...evidence }) => evidence),
    body_ref: { sha256: hash(record.body), bytes: Buffer.byteLength(record.body) },
  };
  if (excerpt && excerpt !== summary) item.excerpt = excerpt;
  if (bindingInvariant(record)) item.invariant = {
    statement: record.statement as string, state: record.state as "accepted" | "enforced", enforcement: record.enforcement,
    depends_on: record.depends_on, enforced_by: record.enforced_by, depended_on_by: record.depended_on_by,
    verification: record.verification, failure_modes: record.failure_modes, impact: record.impact as string, criticality: record.criticality as string,
  };
  return item;
}

function requestRevision(request: ResolveRequest): string {
  const pathSources = Object.entries(request.pathSources ?? {}).sort(([left], [right]) => left.localeCompare(right));
  return hash(JSON.stringify({ task: phrase(request.task), paths: [...new Set(request.paths)].sort(), pathSources, budgetBytes: request.budgetBytes }));
}

function manifestFor(records: readonly DoxRecord[], request: ResolveRequest, delivered: string[], deferred: string[], expanded: string[] = [], parent?: string): ReceiptManifest {
  const recordDigests = Object.fromEntries(records.filter((record) => delivered.includes(record.id) || deferred.includes(record.id)).map((record) => [record.id, recordRevision(record)]));
  const base = { version: RESOLVER_VERSION as 2, parent, corpusDigest: corpusRevision(records), requestDigest: requestRevision(request), budgetBytes: request.budgetBytes, delivered, deferred, expanded, recordDigests };
  return { ...base, id: hash(JSON.stringify(base)) };
}

function renderEnvelope(items: ContextItem[], manifest: ReceiptManifest, limit: number): { output: string; envelope: ResolveEnvelope } {
  const envelope: ResolveEnvelope = {
    schema: "dox.resolve/v2", status: "ok", items,
    receipt: { id: manifest.id, binding_complete: true, delivered: manifest.delivered, deferred: manifest.deferred, budget: { limit_bytes: limit, used_bytes: 0 } },
  };
  let output = "";
  for (let pass = 0; pass < 4; pass += 1) {
    output = `${JSON.stringify(envelope)}\n`;
    const bytes = Buffer.byteLength(output);
    if (envelope.receipt.budget.used_bytes === bytes) break;
    envelope.receipt.budget.used_bytes = bytes;
  }
  output = `${JSON.stringify(envelope)}\n`;
  return { output, envelope };
}

export function resolveContext(records: readonly DoxRecord[], request: ResolveRequest): Resolution {
  if (!request.task.trim()) throw new DoxError("DOX_USAGE: resolve requires one task");
  if (!Number.isSafeInteger(request.budgetBytes) || request.budgetBytes < 1024) throw new DoxError("DOX_USAGE: invalid output budget");
  request.paths.forEach((path) => safeRelative(path));
  const normalizedRequest: ResolveRequest = { ...request, paths: [...new Set(request.paths)].sort() };
  const candidates = new Map<string, Candidate>();
  for (const record of records) {
    const candidate = directCandidate(record, normalizedRequest);
    if (candidate) candidates.set(record.id, candidate);
  }
  addClosure(candidates, records, normalizedRequest.task);
  const ranked = [...candidates.values()].sort(compareCandidates);
  const mandatory = ranked.filter((candidate) => bindingInvariant(candidate.record));
  const optional = ranked.filter((candidate) => !bindingInvariant(candidate.record));
  const selected = [...mandatory];

  const trial = (selection: Candidate[]) => {
    const delivered = selection.map((candidate) => candidate.record.id);
    const deferred = ranked.filter((candidate) => !delivered.includes(candidate.record.id)).map((candidate) => candidate.record.id);
    const manifest = manifestFor(records, normalizedRequest, delivered, deferred);
    const rendered = renderEnvelope(selection.map((candidate) => contextItem(candidate, normalizedRequest.task)), manifest, normalizedRequest.budgetBytes);
    return { ...rendered, manifest };
  };

  let current = trial(selected);
  if (Buffer.byteLength(current.output) > normalizedRequest.budgetBytes) {
    throw new DoxError(`DOX_BUDGET_TOO_SMALL: mandatory context requires ${Buffer.byteLength(current.output)} bytes`);
  }
  for (const candidate of optional) {
    const next = trial([...selected, candidate]);
    if (Buffer.byteLength(next.output) <= normalizedRequest.budgetBytes) { selected.push(candidate); current = next; }
  }
  return current;
}

export function expandContext(records: readonly DoxRecord[], prior: ReceiptManifest, ids: readonly string[], budgetBytes: number): Expansion {
  if (!validReceiptId(prior)) throw new DoxError("DOX_RECEIPT_INVALID: manifest digest mismatch");
  if (prior.version !== 2 || prior.corpusDigest !== corpusRevision(records)) throw new DoxError("DOX_RECEIPT_STALE: records changed after retrieval");
  if (!Number.isSafeInteger(budgetBytes) || budgetBytes < 1024) throw new DoxError("DOX_USAGE: invalid output budget");
  const requested = [...new Set(ids)].sort();
  if (!requested.length) throw new DoxError("DOX_USAGE: expansion requires a record id");
  const discovered = new Set([...prior.delivered, ...prior.deferred]);
  for (const id of requested) {
    if (!discovered.has(id)) throw new DoxError(`DOX_EXPANSION_NOT_DISCOVERED: ${id}`);
    if (prior.expanded.includes(id)) throw new DoxError(`DOX_ALREADY_EXPANDED: ${id}`);
  }
  const byId = new Map(records.map((record) => [record.id, record]));
  const expansions = requested.map((id) => {
    const record = byId.get(id);
    if (!record) throw new DoxError(`DOX_RECEIPT_STALE: missing record ${id}`);
    return { id, file: record.file, sha256: hash(record.body), body: record.body };
  });
  const request: ResolveRequest = { task: "receipt expansion", paths: [], budgetBytes };
  const manifest = manifestFor(records, request, prior.delivered, prior.deferred, [...new Set([...prior.expanded, ...requested])].sort(), prior.id);
  const envelope = { schema: "dox.resolve/v2", status: "ok", expansions, receipt: { id: manifest.id, parent: prior.id, added: requested, budget: { limit_bytes: budgetBytes, used_bytes: 0 } } };
  let output = "";
  for (let pass = 0; pass < 4; pass += 1) {
    output = `${JSON.stringify(envelope)}\n`;
    const bytes = Buffer.byteLength(output);
    if (envelope.receipt.budget.used_bytes === bytes) break;
    envelope.receipt.budget.used_bytes = bytes;
  }
  output = `${JSON.stringify(envelope)}\n`;
  if (Buffer.byteLength(output) > budgetBytes) throw new DoxError(`DOX_BUDGET_TOO_SMALL: expansion requires ${Buffer.byteLength(output)} bytes`);
  return { output, manifest };
}
