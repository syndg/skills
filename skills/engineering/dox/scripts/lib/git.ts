import { lstat, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { DoxError, isInside } from "./safe.ts";

async function run(cwd: string, args: string[]): Promise<string> {
  const proc = Bun.spawn(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  const [code, out, err] = await Promise.all([proc.exited, new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  if (code !== 0) throw new DoxError(err.trim() || `git ${args.join(" ")} failed`);
  return out.trim();
}

export async function gitRoot(cwd = process.cwd()): Promise<string> {
  const root = await run(cwd, ["rev-parse", "--show-toplevel"]);
  return resolve(root);
}

export async function changedPaths(root: string, base?: string): Promise<string[]> {
  const committed = base ? await run(root, ["diff", "--name-only", `${base}...HEAD`]) : "";
  const [working, untracked] = await Promise.all([run(root, ["diff", "--name-only", "HEAD"]), run(root, ["ls-files", "--others", "--exclude-standard"])]);
  return [...new Set([...committed.split("\n"), ...working.split("\n"), ...untracked.split("\n")].filter((path) => path && !path.startsWith(".dox/")))].sort();
}

async function existingFiles(root: string, output: string, deleted: string): Promise<string[]> {
  const removed = new Set(deleted.split("\n").filter(Boolean));
  const rootReal = await realpath(root);
  const files: string[] = [];
  for (const path of output.split("\n").filter((path) => path && !removed.has(path)).sort()) {
    const full = resolve(root, path);
    let fileStat: Awaited<ReturnType<typeof lstat>>;
    try { fileStat = await lstat(full); } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
    if (fileStat.isSymbolicLink()) {
      const target = await realpath(full);
      if (!isInside(rootReal, target)) throw new DoxError(`symlink escape denied: ${path}`);
      if ((await lstat(target)).isFile()) files.push(path);
    } else if (fileStat.isFile()) files.push(path);
  }
  return files;
}

export async function trackedFiles(root: string): Promise<string[]> {
  const [output, deleted] = await Promise.all([
    run(root, ["ls-files", "--cached", "--others", "--exclude-standard"]),
    run(root, ["ls-files", "--deleted"]),
  ]);
  return existingFiles(root, output, deleted);
}

export async function indexTrackedFiles(root: string): Promise<string[]> {
  const [output, deleted] = await Promise.all([
    run(root, ["ls-files", "--cached"]),
    run(root, ["ls-files", "--deleted"]),
  ]);
  return existingFiles(root, output, deleted);
}
