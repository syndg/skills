import { createHash } from "node:crypto";
import type {
  ContextIndex,
  Scope,
  ContextItem,
  ReceiptManifest,
  Record as DoxRecord,
  ResolveEnvelope,
  ResolveRequest,
  RetrievalEvidence,
} from "./types.ts";
import { contractDeclarations } from "./records.ts";
import { DoxError, globMatches, globSpecificity, safeRelative } from "./safe.ts";

const RESOLVER_VERSION = 2;
const MAX_DIRECT_DISCOVERY = 64;
const STOP_WORDS = new Set([
  "a", "an", "and", "about", "apps", "change", "find", "for", "from", "how", "in", "into", "is", "of", "on", "or", "repository",
  "review", "show", "src", "task", "that", "the", "this", "to", "what", "where", "which", "with", "without",
]);
const EXACT_TASK_PRIORITIES = new Set([620, 670, 720, 770, 820, 870]);
const WEAK_EXACT_SINGLE_TOKENS = new Set([
  "agent", "agents", "behavior", "change", "clarification", "code", "command", "commands", "contract", "contracts",
  "decision", "decisions", "expected", "fact", "facts", "file", "files", "implementation", "inference", "invariant", "invariants",
  "modify", "obligation", "obligations", "owner", "owners", "path", "paths", "plan", "relevant", "review", "source", "sources",
  "symbol", "symbols", "task", "test", "testing", "unrelated", "verification", "verify",
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

function orderedPhrase(value: string): string {
  const separated = value.normalize("NFKC").replace(/([\p{Ll}\d])([\p{Lu}])/gu, "$1 $2").toLocaleLowerCase("en-US");
  return (separated.match(/[\p{L}\p{N}]+/gu) ?? []).filter((word) => !STOP_WORDS.has(word)).join(" ");
}

function headings(body: string): string[] {
  return body.split(/\r?\n/u).map((line) => /^#{1,6}\s+(.+)$/u.exec(line)?.[1]?.trim()).filter((line): line is string => Boolean(line));
}

function taskHitCount(record: DoxRecord, taskTokens: Set<string>, includeBody = true): number {
  const fields = [record.id, record.statement ?? "", record.adr ?? "", ...record.contracts, ...record.symbols, ...record.intents, ...record.terms, ...record.aliases, ...headings(record.body)];
  if (includeBody) fields.push(record.body);
  const indexedTokens = new Set(splitWords(fields.join(" ")));
  return [...taskTokens].filter((token) => indexedTokens.has(token)).length;
}

function bindingInvariant(record: DoxRecord): boolean {
  return record.kind === "invariant" && (record.state === "accepted" || record.state === "enforced");
}

function exactTaskEvidence(item: Candidate["evidence"][number]): boolean {
  return item.source === "task" && (EXACT_TASK_PRIORITIES.has(item.priority)
    || item.edge.startsWith("enforcement:") || item.edge.startsWith("dependency:"));
}

function strongExactTaskEvidence(item: Candidate["evidence"][number]): boolean {
  if (!exactTaskEvidence(item)) return false;
  const words = splitWords(item.value);
  if (words.length >= 2) return item.priority >= 770
    || item.edge.startsWith("enforcement:") || item.edge.startsWith("dependency:");
  if (words.length !== 1 || WEAK_EXACT_SINGLE_TOKENS.has(words[0])) return false;
  return item.priority >= 770
    || item.edge.startsWith("enforcement:") || item.edge.startsWith("dependency:");
}

function applicableDirectCandidate(candidate: Candidate, taskTokenCount: number): boolean {
  if (candidate.evidence.some((item) => item.source !== "task")) return true;
  const exactMetadata = candidate.evidence.filter((item) => EXACT_TASK_PRIORITIES.has(item.priority));
  if (!bindingInvariant(candidate.record)) {
    if (candidate.evidence.some(strongExactTaskEvidence)) return true;
    if (exactMetadata.some((item) => taskTokenCount <= 3 || splitWords(item.value).length >= 2)) return true;
    const bodyThreshold = Math.min(taskTokenCount, Math.max(4, Math.ceil(taskTokenCount / 2)));
    const metadataThreshold = Math.min(6, Math.max(1, taskTokenCount));
    return candidate.metadataHits >= metadataThreshold
      || (candidate.metadataHits >= 3 && candidate.evidence.some((item) => item.edge === "record.term"))
      || candidate.taskHits >= bodyThreshold;
  }
  if (candidate.evidence.some(strongExactTaskEvidence)
    || candidate.evidence.some((item) => exactTaskEvidence(item) && splitWords(item.value).length >= 2)) return true;
  return false;
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
    {
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

  {
    for (const [edgeKind, bindings, priority] of [["enforcement", record.enforced_by, 980], ["dependency", record.depended_on_by, 940]] as const) {
      for (const binding of bindings) for (const key of ["symbol", "contract", "intent"] as const) {
        const value = binding[key];
        if (value && includesPhrase(taskPhrase, value) && (!request.paths.length || key !== "intent")) {
          if (edgeKind === "enforcement") candidate.relation = "binding";
          else if (candidate.relation !== "binding") candidate.relation = "dependent";
          addEvidence(candidate, { source: "task", edge: `${edgeKind}:${key}:${value}`, value }, priority);
        }
      }
    }
  }

  return candidate.evidence.length ? candidate : undefined;
}

type GraphLink = { record: DoxRecord; relation: "reference" | "dependent"; source: "graph" | "binding"; edge: string };

function referencedRecords(record: DoxRecord, records: readonly DoxRecord[], scopes: readonly Scope[]): GraphLink[] {
  const byAdr = new Map(records.filter((item) => item.adr).map((item) => [item.adr as string, item]));
  const byContract = new Map<string, DoxRecord>();
  for (const item of records) for (const contract of contractDeclarations(item)) byContract.set(contract, item);
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
    if (binding.path) for (const target of records) {
      const path = binding.path;
      const matches = [...target.paths, ...target.enforced_by.flatMap((edge) => edge.path ? [edge.path] : []), ...target.depended_on_by.flatMap((edge) => edge.path ? [edge.path] : [])]
        .some((pattern) => pattern === path || (!path.includes("*") && globMatches(pattern, path)) || (!pattern.includes("*") && globMatches(path, pattern)));
      const curated = scopes.some((scope) => scope.context.includes(target.id) && (scope.path === "." || path === scope.path || path.startsWith(`${scope.path}/`)));
      if (matches || curated) add(target, "reference", "graph", `depends_on:${path}`);
    }
  }
  const declaredContracts = new Set(contractDeclarations(record));
  for (const target of records) {
    for (const [relation, bindings] of [["binding", target.enforced_by], ["dependent", target.depended_on_by]] as const) {
      for (const binding of bindings) {
        const matches = (binding.contract && declaredContracts.has(binding.contract))
          || (binding.symbol && record.symbols.includes(binding.symbol))
          || (binding.intent && record.intents.includes(binding.intent));
        if (matches) add(target, relation === "binding" ? "reference" : "dependent", "binding", `${relation === "binding" ? "enforcement" : "dependency"}:${binding.contract ?? binding.symbol ?? binding.intent}`);
      }
    }
  }
  return [...out.values()].sort((left, right) => left.record.id.localeCompare(right.record.id));
}

function addClosure(candidates: Map<string, Candidate>, records: readonly DoxRecord[], request: ResolveRequest): void {
  const taskTokens = new Set(splitWords(request.task));
  const visited = new Set<string>();
  const queue = [...candidates.values()].map((candidate) => ({ candidate, depth: 0 }));
  while (queue.length) {
    const { candidate, depth } = queue.shift() as { candidate: Candidate; depth: number };
    if (visited.has(candidate.record.id)) continue;
    visited.add(candidate.record.id);
    const referenced = referencedRecords(candidate.record, records, request.scopes ?? []);
    for (const link of referenced) {
      const record = link.record;
      const taskHits = taskHitCount(record, taskTokens);
      const metadataHits = taskHitCount(record, taskTokens, false);
      const sourceSpecificity = Math.max(0, ...candidate.evidence.map((item) => item.specificity));
      const sourceStrong = sourceSpecificity >= 100 || candidate.evidence.some(strongExactTaskEvidence)
        || candidate.evidence.some((item) => exactTaskEvidence(item) && splitWords(item.value).length >= 2);
      const referenceScore = sourceStrong ? 20 + candidate.metadataHits * 10 + candidate.taskHits : metadataHits >= 2 ? metadataHits * 10 : 0;
      if (referenceScore > 0) candidate.referenceScore = Math.max(candidate.referenceScore, referenceScore + 1);
      const existing = candidates.get(record.id);
      if (existing) {
        if (link.relation === "dependent" && existing.relation !== "binding") existing.relation = "dependent";
        else if (existing.relation === "record") existing.relation = "reference";
        existing.referenceScore = Math.max(existing.referenceScore, referenceScore);
        addEvidence(existing, { source: link.source, edge: link.edge, value: record.id }, 400 - depth * 25);
        if (!visited.has(existing.record.id)) queue.push({ candidate: existing, depth: depth + 1 });
        continue;
      }
      const relation: Relation = link.relation === "dependent" ? "dependent" : bindingInvariant(record) ? "binding" : "reference";
      const added: Candidate = { record, relation, evidence: [], graphDepth: depth + 1, taskHits, metadataHits, referenceScore };
      addEvidence(added, { source: link.source, edge: link.edge, value: record.id }, 400 - depth * 25);
      candidates.set(record.id, added);
      queue.push({ candidate: added, depth: depth + 1 });
    }
  }
}

function rank(candidate: Candidate): number[] {
  const mandatory = bindingInvariant(candidate.record) ? 1 : 0;
  const best = Math.max(...candidate.evidence.map((item) => item.priority));
  const classes = new Set(candidate.evidence.map((item) => `${item.source}:${item.edge.split(":")[0]}`)).size;
  const specificity = Math.max(0, ...candidate.evidence.map((item) => item.specificity));
  const authoritative = candidate.evidence.some((item) => ["path", "changed-path", "binding", "scope"].includes(item.source));
  const exactTask = candidate.evidence.filter(exactTaskEvidence);
  const exactMultiword = exactTask.some((item) => splitWords(item.value).length >= 2);
  const strongExactMetadata = candidate.evidence.some(strongExactTaskEvidence) ? 1 : 0;
  const applicability = authoritative || strongExactMetadata || candidate.metadataHits >= 3 ? 1 : 0;
  const exactPath = candidate.evidence.some((item) => (item.source === "path" || item.source === "changed-path") && item.edge.startsWith("record.path:") && !/[*?\[]/u.test(item.edge.slice("record.path:".length))) ? 1 : 0;
  const narrowScope = specificity >= 100 ? 1 : 0;
  const relevance = candidate.metadataHits * 4 + candidate.taskHits + narrowScope;
  return [mandatory, Number(authoritative), exactPath, strongExactMetadata, candidate.referenceScore, Number(exactMultiword), relevance, narrowScope, best, classes, -candidate.graphDepth, applicability];
}

function compareCandidates(left: Candidate, right: Candidate): number {
  const a = rank(left); const b = rank(right);
  for (let index = 0; index < a.length; index += 1) if (a[index] !== b[index]) return b[index] - a[index];
  return left.record.id.localeCompare(right.record.id);
}

function relevantExcerpt(record: DoxRecord, task: string): string {
  const taskPhrase = orderedPhrase(task);
  const taskTokens = new Set(splitWords(task));
  const exactMetadataPhrases = [...record.terms, ...record.aliases, ...record.symbols, ...record.intents]
    .map((value) => orderedPhrase(value))
    .filter((value) => value.split(" ").length >= 2 && (` ${taskPhrase} `).includes(` ${value} `));
  const paragraphs = record.body.split(/\r?\n\s*\r?\n/u).map((paragraph) => paragraph.trim()).filter(Boolean);
  const prose = paragraphs.filter((paragraph) => !/^#{1,6}\s+/u.test(paragraph));
  const ranked = (prose.length ? prose : paragraphs).map((paragraph) => {
    const paragraphPhrase = orderedPhrase(paragraph);
    return { paragraph, exactMetadataHits: exactMetadataPhrases.filter((value) => (` ${paragraphPhrase} `).includes(` ${value} `)).length, hits: tokenCoverage(taskTokens, paragraph).hits };
  });
  ranked.sort((left, right) => right.exactMetadataHits - left.exactMetadataHits || right.hits - left.hits);
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
    title: headings(record.body)[0] ?? record.statement ?? record.id, adr: record.adr,
    paths: record.paths, symbols: record.symbols, terms: record.terms, aliases: record.aliases, intents: record.intents,
    contracts: record.contracts, adr_refs: record.adr_refs, contract_refs: record.contract_refs,
    depends_on: record.depends_on, enforced_by: record.enforced_by, depended_on_by: record.depended_on_by,
    relation: bindingInvariant(record) ? (candidate.relation === "dependent" ? "dependent" : "binding") : record.kind === "invariant" && record.state === "proposed" ? "proposal" : candidate.relation,
    summary, file: record.file, source,
    evidence: candidate.evidence.sort((left, right) => right.priority - left.priority || left.edge.localeCompare(right.edge) || left.value.localeCompare(right.value)).map(({ priority: _priority, specificity: _specificity, ...evidence }) => evidence),
    body_ref: { sha256: hash(record.body), bytes: Buffer.byteLength(record.body) },
  };
  if (excerpt && excerpt !== summary) item.excerpt = excerpt;
  if (!bindingInvariant(record)) {
    item.state = record.state;
    item.impact = record.impact;
    item.criticality = record.criticality;
    if (record.enforcement.length) item.enforcement = record.enforcement;
    if (record.verification.length) item.verification = record.verification;
    if (record.failure_modes.length) item.failure_modes = record.failure_modes;
  }
  if (bindingInvariant(record)) item.invariant = {
    statement: record.statement as string, state: record.state as "accepted" | "enforced", enforcement: record.enforcement,
    depends_on: record.depends_on, enforced_by: record.enforced_by, depended_on_by: record.depended_on_by,
    verification: record.verification, failure_modes: record.failure_modes, impact: record.impact as string, criticality: record.criticality as string,
  };
  return item;
}

function requestRevision(request: ResolveRequest): string {
  const pathSources = Object.entries(request.pathSources ?? {}).sort(([left], [right]) => left.localeCompare(right));
  return hash(JSON.stringify({ task: phrase(request.task), paths: [...new Set(request.paths)].sort(), pathSources, budgetBytes: request.budgetBytes, format: request.format ?? "text", mode: request.mode ?? "resolve", scopes: request.scopes ?? [] }));
}

function manifestFor(records: readonly DoxRecord[], request: ResolveRequest, delivered: string[], deferred: string[], expanded: string[] = [], parent?: string): ReceiptManifest {
  const recordDigests = Object.fromEntries(records.filter((record) => delivered.includes(record.id) || deferred.includes(record.id)).map((record) => [record.id, recordRevision(record)]));
  const base = { version: RESOLVER_VERSION as 2, parent, corpusDigest: corpusRevision(records), scopesDigest: hash(JSON.stringify(request.scopes ?? [])), requestDigest: requestRevision(request), budgetBytes: request.budgetBytes, delivered, deferred, expanded, recordDigests };
  return { ...base, id: hash(JSON.stringify(base)) };
}

function selectedScopes(request: ResolveRequest): ResolveEnvelope["scopes"] {
  const selected = new Map<string, ResolveEnvelope["scopes"][number]>();
  for (const target of request.paths) {
    const chain = (request.scopes ?? []).filter((scope) => scope.path === "." || target === scope.path || target.startsWith(`${scope.path}/`))
      .sort((a, b) => (a.path === "." ? 0 : a.path.split("/").length) - (b.path === "." ? 0 : b.path.split("/").length) || a.path.localeCompare(b.path));
    if (request.mode === "brief" && !chain.length) throw new DoxError(`DOX_SCOPE_MISSING: no curated scope for ${target}; configure scopes in dox.config.json`);
    for (const scope of chain) {
      const existing = selected.get(scope.path);
      if (existing) existing.targets.push(target);
      else selected.set(scope.path, { ...scope, targets: [target] });
    }
  }
  return [...selected.values()];
}

function contextIndex(record: DoxRecord): ContextIndex {
  return {
    id: record.id, kind: record.kind, title: headings(record.body)[0] ?? record.statement ?? record.id,
    adr: record.adr, file: record.file,
    source: record.source_path ? { path: record.source_path, heading: record.source_heading, sha256: record.source_sha256, digest: record.source_digest } : undefined,
  };
}

// Text preserves every field and wraps only at whitespace. Long identifiers remain copyable.
function textValue(value: unknown, indent = 0): string[] {
  const prefix = " ".repeat(indent);
  if (typeof value === "string") {
    let fence: string | undefined;
    return value.split(/\r?\n/u).flatMap((line) => {
      const marker = /^\s*(`{3,}|~{3,})/u.exec(line)?.[1];
      if (marker) {
        if (!fence) fence = marker;
        else if (marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
        return [`${prefix}${line}`];
      }
      if (fence || /^(?: {4}|\t)/u.test(line)) return [`${prefix}${line}`];
      const linePrefix = prefix + (/^\s*/u.exec(line)?.[0] ?? "");
      const words = line.split(/\s+/u).filter(Boolean);
      const lines: string[] = [];
      let current = linePrefix;
      for (const word of words) {
        if (current.length > linePrefix.length && current.length + word.length + 1 > 120) { lines.push(current); current = linePrefix; }
        current += `${current.length > linePrefix.length ? " " : ""}${word}`;
      }
      lines.push(current);
      return lines;
    });
  }
  if (Array.isArray(value)) {
    if (!value.length) return [`${prefix}(none)`];
    return value.flatMap((item) => {
      const lines = textValue(item, indent + 2);
      lines[0] = `${prefix}- ${lines[0].slice(indent + 2)}`;
      return lines;
    });
  }
  if (value && typeof value === "object") return Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .flatMap(([key, item]) => {
      if (Array.isArray(item) && item.length === 0) return [`${prefix}${key}: (none)`];
      if (typeof item === "string" && !item.includes("\n")) return textValue(`${key}: ${item}`, indent);
      if (typeof item === "number" || typeof item === "boolean") return [`${prefix}${key}: ${item}`];
      return [`${prefix}${key}:`, ...textValue(item, indent + 2)];
    });
  return [`${prefix}${String(value)}`];
}

function renderOutput<T extends { receipt: { budget: { used_bytes: number } } }>(envelope: T, format: ResolveRequest["format"]): string {
  const serialize = () => format === "json" ? `${JSON.stringify(envelope, null, 2)}\n` : `${textValue(envelope).join("\n")}\n`;
  let output = serialize();
  while (envelope.receipt.budget.used_bytes !== Buffer.byteLength(output)) {
    envelope.receipt.budget.used_bytes = Buffer.byteLength(output);
    output = serialize();
  }
  return output;
}

export function resolveContext(records: readonly DoxRecord[], request: ResolveRequest): Resolution {
  if (request.mode !== "brief" && !request.task.trim()) throw new DoxError("DOX_USAGE: resolve requires one subject");
  if (!Number.isSafeInteger(request.budgetBytes) || request.budgetBytes < 1024) throw new DoxError("DOX_USAGE: invalid output budget");
  const normalizedRequest: ResolveRequest = { ...request, paths: [...new Set(request.paths.map((path) => safeRelative(path).replace(/^(?:\.\/)+/u, "").replace(/\/+$/u, "") || "."))].sort() };
  if (request.mode === "brief" && !normalizedRequest.paths.length) throw new DoxError("DOX_NO_TARGETS: brief requires at least one --path or changed file");
  const scopes = selectedScopes(normalizedRequest);
  const standing = [...new Set(scopes.flatMap((scope) => scope.context))];
  const candidates = new Map<string, Candidate>();
  const taskTokenCount = splitWords(normalizedRequest.task).length;
  for (const record of records) {
    let candidate = directCandidate(record, normalizedRequest);
    if (standing.includes(record.id)) {
      candidate ??= { record, relation: "record", evidence: [], graphDepth: 0, taskHits: 0, metadataHits: 0, referenceScore: 0 };
      for (const scope of scopes.filter((scope) => scope.context.includes(record.id))) {
        addEvidence(candidate, { source: "scope", edge: `scope:${scope.path}`, value: record.id }, 1100, 100);
      }
    }
    if (!candidate || !applicableDirectCandidate(candidate, taskTokenCount)) continue;
    if (normalizedRequest.paths.length && !candidate.evidence.some((item) => item.source !== "task")) {
      const named = candidate.evidence.some((item) => item.source === "task" && (
        (["record.identifier", "record.symbol"].includes(item.edge) && includesPhrase(phrase(request.task), item.value))
        || (/^(?:enforcement|dependency):(symbol|contract):/u.test(item.edge) && strongExactTaskEvidence(item))
      ));
      if (!named) continue;
    }
    candidates.set(record.id, candidate);
  }
  // Choose task-only seeds before traversing their declarations. Otherwise an unrelated
  // lexical candidate can smuggle an invariant into mandatory context through its graph.
  const direct = [...candidates.values()].sort(compareCandidates);
  const exact = direct.filter((candidate) => candidate.evidence.some(strongExactTaskEvidence));
  if (!normalizedRequest.paths.length && exact.length) {
    for (const candidate of direct) if (!exact.includes(candidate) && !bindingInvariant(candidate.record)) candidates.delete(candidate.record.id);
  }
  addClosure(candidates, records, normalizedRequest);
  const ranked = [...candidates.values()].sort(compareCandidates);
  const byId = new Map(records.map((record) => [record.id, record]));
  const byAdr = new Map(records.filter((record) => record.adr).map((record) => [record.adr, record]));
  const required = [
    ...standing.map((id) => candidates.get(id)!),
    ...ranked.filter((candidate) => bindingInvariant(candidate.record) && !standing.includes(candidate.record.id)),
  ];
  const decisionRecords = [...new Map([
    ...scopes.flatMap((scope) => scope.decisions).map((adr) => byAdr.get(adr)!),
    ...(request.mode === "brief"
      ? required.flatMap((candidate) => candidate.record.adr_refs).map((adr) => byAdr.get(adr)!)
      : ranked.filter((candidate) => candidate.record.kind === "decision").map((candidate) => candidate.record)),
  ].map((record) => [record.id, record])).values()];
  const optional = request.mode === "brief" ? [] : ranked.filter((candidate) => !required.includes(candidate));
  const selected = [...required];
  const discovered = [...new Set([...standing, ...(request.mode === "brief" ? required : ranked).map((candidate) => candidate.record.id), ...decisionRecords.map((record) => record.id)])];
  // Named retrieval retains supplementary discovery; a brief does not refill curated
  // context with legacy path-matched excerpts merely because there is spare budget.
  if (request.mode !== "brief") for (const candidate of direct.slice(0, MAX_DIRECT_DISCOVERY)) if (!discovered.includes(candidate.record.id)) discovered.push(candidate.record.id);
  const trial = (selection: Candidate[]): Resolution => {
    const delivered = selection.map((candidate) => candidate.record.id);
    const deferred = discovered.filter((id) => !delivered.includes(id));
    const expanded = standing;
    const manifest = manifestFor(records, normalizedRequest, delivered, deferred, expanded);
    const items = selection.map((candidate) => {
      const item = contextItem(candidate, normalizedRequest.task);
      if (standing.includes(item.id)) {
        item.body = candidate.record.body;
        item.scopes = scopes.filter((scope) => scope.context.includes(item.id)).map((scope) => scope.path);
        delete item.excerpt;
      }
      return item;
    });
    const envelope: ResolveEnvelope = {
      schema: request.mode === "brief" ? "dox.brief/v1" : "dox.resolve/v2",
      status: discovered.length || scopes.length ? "ok" : "no-context", items, scopes,
      decisions: decisionRecords.map(contextIndex),
      deferred: deferred.filter((id) => !decisionRecords.some((record) => record.id === id)).map((id) => contextIndex(byId.get(id)!)),
      receipt: {
        id: manifest.id, binding_complete: true,
        context_complete: request.mode === "brief" || deferred.length === 0,
        delivered, deferred, budget: { limit_bytes: request.budgetBytes, used_bytes: 0 },
      },
    };
    return { output: renderOutput(envelope, request.format), envelope, manifest };
  };
  let current = trial(selected);
  if (Buffer.byteLength(current.output) > request.budgetBytes) throw new DoxError(`DOX_BUDGET_TOO_SMALL: required context and discovery index require ${Buffer.byteLength(current.output)} bytes; limit ${request.budgetBytes}; no context delivered`);
  for (const candidate of optional) {
    const next = trial([...selected, candidate]);
    if (Buffer.byteLength(next.output) > request.budgetBytes) continue;
    selected.push(candidate);
    current = next;
  }
  return current;
}

export function expandContext(records: readonly DoxRecord[], prior: ReceiptManifest, ids: readonly string[], budgetBytes: number, scopes: Scope[] = [], format: ResolveRequest["format"] = "text"): Expansion {
  if (!validReceiptId(prior)) throw new DoxError("DOX_RECEIPT_INVALID: manifest digest mismatch");
  if (prior.version !== 2 || prior.corpusDigest !== corpusRevision(records)) throw new DoxError("DOX_RECEIPT_STALE: records changed after retrieval");
  if (prior.scopesDigest !== hash(JSON.stringify(scopes))) throw new DoxError("DOX_RECEIPT_STALE: curated scopes changed after retrieval");
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
  const request: ResolveRequest = { task: "receipt expansion", paths: [], budgetBytes, scopes, format };
  const manifest = manifestFor(records, request, prior.delivered, prior.deferred, [...new Set([...prior.expanded, ...requested])].sort(), prior.id);
  const envelope = { schema: "dox.resolve/v2", status: "ok", expansions, receipt: { id: manifest.id, parent: prior.id, added: requested, budget: { limit_bytes: budgetBytes, used_bytes: 0 } } };
  const output = renderOutput(envelope, format);
  if (Buffer.byteLength(output) > budgetBytes) throw new DoxError(`DOX_BUDGET_TOO_SMALL: expansion requires ${Buffer.byteLength(output)} bytes`);
  return { output, manifest };
}
