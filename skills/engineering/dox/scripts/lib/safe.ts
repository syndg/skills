import { relative, resolve, sep } from "node:path";

export class DoxError extends Error {}

export function isInside(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !resolve(candidate).startsWith(`${sep}${sep}`));
}

export function safeRelative(value: string, label = "path"): string {
  if (!value || value.includes("\0") || value.startsWith("/") || value.startsWith("\\") || value.split(/[\\/]/).includes("..")) {
    throw new DoxError(`unsafe ${label}: ${value}`);
  }
  return value.replaceAll("\\", "/");
}

export function safeGlob(value: string, label = "glob"): string {
  safeRelative(value, label);
  if (value.includes("[") || value.includes("]") || value.includes("{") || value.includes("}") || value.includes("(")) {
    throw new DoxError(`invalid ${label}: ${value}`);
  }
  return value;
}

export function globMatches(pattern: string, path: string): boolean {
  safeGlob(pattern);
  safeRelative(path);
  const quoted = pattern.replace(/[.+^$|\\]/g, "\\$&").replaceAll("**", "\u0000").replaceAll("*", "[^/]*").replaceAll("\u0000", ".*");
  return new RegExp(`^${quoted}$`).test(path);
}

export function globSpecificity(pattern: string): number {
  return pattern.replaceAll("*", "").length * 10 - (pattern.match(/\*/g)?.length ?? 0);
}

export function asStrings(value: unknown, label: string, required = false): string[] {
  if (value === undefined || value === null) {
    if (required) throw new DoxError(`missing ${label}`);
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  if (!list.every((item) => typeof item === "string" && item.trim())) throw new DoxError(`invalid ${label}`);
  return list.map((item) => (item as string).trim());
}

export function asBindings(value: unknown, label: string): { path?: string; symbol?: string; contract?: string; intent?: string }[] {
  if (value === undefined || value === null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.map((item) => {
    if (typeof item === "string") return { path: safeGlob(item, label) };
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new DoxError(`invalid ${label}`);
    const binding = item as Record<string, unknown>;
    const out: { path?: string; symbol?: string; contract?: string; intent?: string } = {};
    for (const key of ["path", "symbol", "contract", "intent"] as const) {
      if (binding[key] !== undefined) {
        if (typeof binding[key] !== "string" || !binding[key]) throw new DoxError(`invalid ${label}.${key}`);
        out[key] = key === "path" ? safeGlob(binding[key] as string, label) : binding[key] as string;
      }
    }
    if (Object.keys(out).length === 0) throw new DoxError(`empty ${label} binding`);
    return out;
  });
}
