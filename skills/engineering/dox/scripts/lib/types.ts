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

export type Config = {
  records_dir: string;
  owners?: string[];
  coverage?: { paths?: string[] };
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
