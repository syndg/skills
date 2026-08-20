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
  const args = base ? ["diff", "--name-only", `${base}...HEAD`] : ["diff", "--name-only", "HEAD"];
  const [tracked, untracked] = await Promise.all([run(root, args), run(root, ["ls-files", "--others", "--exclude-standard"])]);
  return [...new Set([...tracked.split("\n"), ...untracked.split("\n")].filter(Boolean))].sort();
}

export async function trackedFiles(root: string): Promise<string[]> {
  const [output, deleted] = await Promise.all([
    run(root, ["ls-files", "--cached", "--others", "--exclude-standard"]),
    run(root, ["ls-files", "--deleted"]),
  ]);
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
