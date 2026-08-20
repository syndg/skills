import type { Binding, Match, Record as DoxRecord } from "./types.ts";
import { globMatches, globSpecificity, safeRelative } from "./safe.ts";

export type Cues = { paths: string[]; intents: string[]; symbols: string[]; terms: string[]; adrs: string[] };

function same(left: string, right: string): boolean {
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}

function includes(values: string[], value: string): boolean {
  return values.some((candidate) => same(candidate, value));
}

function bindingInvariant(record: DoxRecord): boolean {
  return record.kind === "invariant" && (record.state === "accepted" || record.state === "enforced");
}

function matchLabel(match: Match): string {
  if (match.record.kind === "invariant" && !bindingInvariant(match.record)) return match.record.state === "proposed" ? "proposal" : "record";
  return match.full ? "binding" : "dependent";
}

function bindingMatch(binding: Binding, cues: Cues): { reason: string; score: number } | undefined {
  if (binding.path) {
    for (const path of cues.paths) if (globMatches(binding.path, path)) return { reason: `path:${path}`, score: 9500 + globSpecificity(binding.path) };
  }
  if (binding.symbol && includes(cues.symbols, binding.symbol)) return { reason: `symbol:${binding.symbol}`, score: 7000 };
  if (binding.intent && includes(cues.intents, binding.intent)) return { reason: `intent:${binding.intent}`, score: 6000 };
  if (binding.contract && includes(cues.terms, binding.contract)) return { reason: `contract:${binding.contract}`, score: 6500 };
  return undefined;
}

function normalMatch(record: DoxRecord, cues: Cues, includePaths = true): { reason: string; edge: string; score: number } | undefined {
  let best: { reason: string; edge: string; score: number } | undefined;
  const add = (candidate: { reason: string; edge: string; score: number }) => {
    if (!best || candidate.score > best.score || (candidate.score === best.score && candidate.reason < best.reason)) best = candidate;
  };
  if (includePaths) for (const pattern of record.paths) for (const path of cues.paths) if (globMatches(pattern, path)) add({ reason: `path:${path}`, edge: `record.path:${pattern}`, score: 10000 + globSpecificity(pattern) });
  for (const intent of record.intents) if (includes(cues.intents, intent)) add({ reason: `intent:${intent}`, edge: "record.intent", score: 5000 });
  for (const symbol of record.symbols) if (includes(cues.symbols, symbol)) add({ reason: `symbol:${symbol}`, edge: "record.symbol", score: 4000 });
  for (const term of record.terms) if (includes(cues.terms, term)) add({ reason: `term:${term}`, edge: "record.term", score: 3000 });
  for (const alias of record.aliases) if (includes(cues.terms, alias)) add({ reason: `alias:${alias}`, edge: "record.alias", score: 2900 });
  for (const contract of record.contracts) if (includes(cues.terms, contract)) add({ reason: `contract:${contract}`, edge: "record.contract", score: 3100 });
  if (record.adr && includes(cues.adrs, record.adr)) add({ reason: `adr:${record.adr}`, edge: "record.adr", score: 3500 });
  return best;
}

export function resolve(records: DoxRecord[], cues: Cues): Match[] {
  cues.paths.forEach((path) => safeRelative(path));
  const matches = new Map<string, Match>();
  for (const record of records) {
    let found: Match | undefined;
    if (bindingInvariant(record)) {
      for (const binding of record.enforced_by) {
        const match = bindingMatch(binding, cues);
        if (match) {
          found = { record, reason: match.reason, edge: `enforcement:${binding.path ?? binding.symbol ?? binding.intent ?? binding.contract}`, full: true, score: match.score };
          break;
        }
      }
      if (!found) for (const binding of record.depended_on_by) {
        const match = bindingMatch(binding, cues);
        if (match) {
          found = { record, reason: match.reason, edge: `dependency:${binding.path ?? binding.symbol ?? binding.intent ?? binding.contract}`, full: false, score: match.score - 100 };
          break;
        }
      }
    }
    const normal = normalMatch(record, cues, !(record.kind === "invariant" && found && !found.full));
    if (normal && (!found || normal.score > found.score)) found = { record, ...normal, full: true };
    if (found) {
      const existing = matches.get(record.id);
      if (!existing || found.score > existing.score) matches.set(record.id, found);
    }
  }
  return [...matches.values()].sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id));
}

function invariantSummary(record: DoxRecord): string {
  return record.statement ?? record.body.split(/\r?\n/u).map((line) => line.replace(/^#+\s*/u, "").trim()).find(Boolean) ?? record.id;
}

export function publicRecord(match: Match): Record<string, unknown> {
  const record = match.record;
  const source = record.source_path ? { path: record.source_path, heading: record.source_heading, sha256: record.source_sha256, digest: record.source_digest } : undefined;
  const base = {
    id: record.id, kind: record.kind, owner: record.owner, state: record.state, statement: record.statement,
    file: record.file, source, match: matchLabel(match),
  };
  if (!match.full && record.kind === "invariant") return {
    ...base, summary: invariantSummary(record), impact: record.impact, criticality: record.criticality,
    enforced_by: record.enforced_by, depended_on_by: record.depended_on_by, verification: record.verification, failure_modes: record.failure_modes,
  };
  return {
    ...base,
    paths: record.paths, intents: record.intents, symbols: record.symbols, terms: record.terms, aliases: record.aliases,
    adr: record.adr, adr_refs: record.adr_refs, contracts: record.contracts, contract_refs: record.contract_refs,
    enforced_by: record.enforced_by, depended_on_by: record.depended_on_by, enforcement: record.enforcement,
    verification: record.verification, failure_modes: record.failure_modes, impact: record.impact, criticality: record.criticality,
    body: record.body,
  };
}

export function receipt(matches: Match[]): Record<string, string>[] {
  return matches.map((match) => ({ id: match.record.id, match: matchLabel(match), reason: match.reason, edge: match.edge }));
}

export function markdown(matches: Match[]): string {
  const lines = ["# DOX resolution", ""];
  for (const match of matches) {
    const record = match.record;
    lines.push(`## ${record.id}`, `- Match: ${matchLabel(match)}`, `- Reason: ${match.reason}`, `- Edge: ${match.edge}`, `- Owner: ${record.owner ?? "unassigned"}`);
    if (record.statement) lines.push(`- Statement: ${record.statement}`);
    if (record.source_path) lines.push(`- Source: ${record.source_path}${record.source_heading ? `#${record.source_heading}` : ""}`);
    if (record.verification.length) lines.push(`- Proof: ${record.verification.join("; ")}`);
    if (match.full) lines.push("", record.body.trim());
    else lines.push(`- Summary: ${invariantSummary(record)}`, `- Impact: ${record.impact ?? "unspecified"}`);
    lines.push("");
  }
  lines.push("## Receipt", ...receipt(matches).map((entry) => `- ${entry.id}: ${entry.match}; ${entry.reason}; ${entry.edge}`));
  return lines.join("\n") + "\n";
}
