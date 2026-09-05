export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type Binding = {
  path?: string;
  symbol?: string;
  contract?: string;
  intent?: string;
};

export type Record = {
  id: string;
  kind: string;
  owner?: string;
  statement?: string;
  paths: string[];
  intents: string[];
  symbols: string[];
  terms: string[];
  aliases: string[];
  adr?: string;
  adr_refs: string[];
  contracts: string[];
  contract_refs: string[];
  depends_on: Binding[];
  enforced_by: Binding[];
  depended_on_by: Binding[];
  enforcement: string[];
  verification: string[];
  failure_modes: string[];
  impact?: string;
  criticality?: string;
  state?: string;
  source_path?: string;
  source_heading?: string;
  source_sha256?: string;
  source_digest?: string;
  body: string;
  file: string;
};

export type Scope = { path: string; context: string[]; decisions: string[] };

export type Config = {
  schema_version: 1;
  records_dir: string;
  owners?: string[];
  coverage?: { paths?: string[] };
  scopes?: Scope[];
};

export type Match = {
  record: Record;
  reason: string;
  edge: string;
  full: boolean;
  score: number;
};

export type Diagnostic = {
  level: "error" | "warning";
  file?: string;
  message: string;
};

export type RetrievalEvidence = {
  source: "task" | "path" | "changed-path" | "graph" | "binding" | "scope";
  edge: string;
  value: string;
};

export type ResolveRequest = {
  task: string;
  paths: string[];
  pathSources?: globalThis.Record<string, "path" | "changed-path">;
  budgetBytes: number;
  scopes?: Scope[];
  format?: "text" | "json";
  mode?: "resolve" | "brief";
};

export type ContextItem = {
  id: string;
  kind: string;
  owner?: string;
  relation: "record" | "proposal" | "binding" | "dependent" | "reference";
  summary: string;
  title: string;
  adr?: string;
  body?: string;
  scopes?: string[];
  paths: string[];
  symbols: string[];
  terms: string[];
  aliases: string[];
  intents: string[];
  contracts: string[];
  adr_refs: string[];
  contract_refs: string[];
  depends_on: Binding[];
  enforced_by: Binding[];
  depended_on_by: Binding[];
  state?: string;
  enforcement?: string[];
  verification?: string[];
  failure_modes?: string[];
  impact?: string;
  criticality?: string;
  excerpt?: string;
  file: string;
  source?: { path: string; heading?: string; sha256?: string; digest?: string };
  evidence: RetrievalEvidence[];
  body_ref: { sha256: string; bytes: number };
  invariant?: {
    statement: string;
    state: "accepted" | "enforced";
    enforcement: string[];
    depends_on: Binding[];
    enforced_by: Binding[];
    depended_on_by: Binding[];
    verification: string[];
    failure_modes: string[];
    impact: string;
    criticality: string;
  };
};

export type ReceiptManifest = {
  version: 2;
  id: string;
  parent?: string;
  corpusDigest: string;
  scopesDigest: string;
  requestDigest: string;
  budgetBytes: number;
  delivered: string[];
  deferred: string[];
  expanded: string[];
  recordDigests: globalThis.Record<string, string>;
};

export type ResolveEnvelope = {
  schema: "dox.resolve/v2" | "dox.brief/v1";
  status: "ok" | "no-context";
  items: ContextItem[];
  scopes: Array<{ path: string; targets: string[]; context: string[]; decisions: string[] }>;
  decisions: ContextIndex[];
  deferred: ContextIndex[];
  receipt: {
    id: string;
    binding_complete: true;
    context_complete: boolean;
    delivered: string[];
    deferred: string[];
    budget: { limit_bytes: number; used_bytes: number };
  };
};

export type ContextIndex = {
  id: string;
  title: string;
  kind: string;
  adr?: string;
  file: string;
  source?: ContextItem["source"];
};
