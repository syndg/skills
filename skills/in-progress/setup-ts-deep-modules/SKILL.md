---
name: setup-ts-deep-modules
description: Wire dependency-cruiser into a TypeScript repo so each package is a deep module — implementation hidden in subfolders, reachable only through its entry-point files. User-invoked.
disable-model-invocation: true
---

# Setup TS Deep Modules

Make every package in this repo a **deep module**: a lot of behaviour behind a small interface. A package's public surface is its **entry points** — the files at the package root — and everything in its subfolders is hidden. This skill installs [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) and the rules that make the entry points the only way in, then proves the rules bite.

Run the `/codebase-design` skill for the deep-module, interface, seam, and depth vocabulary, and use that language throughout.

## The shape this enforces

```
src/packages/
  <name>/
    index.ts        ← an entry point (public). Import this from outside.
    client.ts       ← another entry point. Packages may expose SEVERAL.
    lib/            ← implementation: hidden from outside, free to import each other.
    tests/          ← co-located tests + fixtures (a subfolder, so private).
```

The public surface is the package's **root files** — not one designated `index.ts`. By convention implementation lives in `lib/` and tests in `tests/`, giving every package the same two-folder shape. The rule itself is general, though: *anything* in *any* subfolder is private, so you never extend the config to add a folder.

Four rules, all `error`:

1. **Entry-point boundary** — code outside a package (app code or another package) may import only that package's entry points (its root files), never anything in its subfolders.
2. **Intra-package freedom** — a package's own files import each other freely.
3. **Tests through the entry points** — files under `<pkg>/tests/` may import any package's entry points and their own `tests/` fixtures, but never any package's subfolder internals (not even their own). Integration tests across packages are fine; deep imports are not.
4. **No cycles** — no dependency cycles.

**Entry points, not a barrel.** Because the public surface is *every* root file, a package can expose several small entry points (`index.ts`, `client.ts`, `server.ts`) instead of funnelling everything through one giant `index.ts`. Barrel files that re-export a whole subtree are discouraged — keep entry points small and hide implementation in subfolders.

Layering (which packages may depend on which) is a *different* concern and is left as a commented stub in the config for this repo to fill in.

## Steps

### 1. Resolve the repository contract

Check for `dox.config.json` when choosing the contract route.

- When it exists, follow the installed `/dox` skill for retrieval eligibility, context reuse, and maintenance.
- When it does not exist, read the applicable root-to-nearest `AGENTS.md` chain and any co-located `DECISIONS.md` entries it indexes before continuing. Read `CLAUDE.md` only for harness-operational instructions, never as fallback domain-contract storage.

**Done when:** the selected contract route is satisfied for the package-boundary design.

### 2. Detect the environment

- **Package manager** — `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` → bun, else npm. Use it for every command below (`pnpm`/`yarn`/`npm run`/`bunx`).
- **Packages root** — if `src/` exists use `src/packages`, else `packages`. Confirm the choice with the user if the repo already has a different obvious convention.
- **Existing config** — check for a `.dependency-cruiser.*` file. If one exists, do **not** overwrite it: merge the four rules and the options in, and tell the user what you added.

**Done when:** package manager, packages root, and existing-config status are all known.

### 3. Install dependency-cruiser

Install `dependency-cruiser` as a devDependency with the detected package manager.

**Done when:** `dependency-cruiser` is in `devDependencies`.

### 4. Write the config

Copy [`dependency-cruiser.config.cjs`](./dependency-cruiser.config.cjs) to the repo root as `.dependency-cruiser.cjs`. Set `PACKAGES_ROOT` to the root detected in step 2. The rules are path-depth based and extension-agnostic, so nothing else needs adapting.

**Done when:** `.dependency-cruiser.cjs` exists with the correct `PACKAGES_ROOT`, and the four forbidden rules are present.

### 5. Wire it into the checks

- Add a `lint:boundaries` script: `depcruise <packages-root>` (or `depcruise src`).
- Fold it into the repo's umbrella check command — the one that already runs typecheck (e.g. a `check` / `ci` / `validate` script). Do **not** touch `tsconfig` or add path aliases.
- If there is no umbrella script, add `lint:boundaries` and tell the user to include it in CI.

**Done when:** `lint:boundaries` exists and runs as part of the same command as typecheck.

### 6. Scaffold the example package

Create a committed `<packages-root>/example/` as a copy-me template:

- `index.ts` — an entry point. Export one function that delegates to an internal file (so the package is visibly *deep*, not a pass-through).
- `lib/impl.ts` — an internal file in a **subfolder**, imported by `index.ts`, not reachable from outside.
- `tests/example.test.ts` — imports **only** `../index` (an entry point), and asserts against the public function.

Tell the user this is a starter template to copy or delete.

**Done when:** the example package exists, exposes its behaviour through a root entry point, and hides `impl` in a subfolder.

### 7. Prove the rules bite

This is the completion criterion for the whole skill — a config that doesn't fail on a violation is worthless.

1. Run `lint:boundaries`. It must **pass** on the clean example.
2. Temporarily add a deep import to `tests/example.test.ts` (e.g. `import { thing } from "../lib/impl"`). Run `lint:boundaries` again — it must **fail** with `tests-through-entrypoints`.
3. Revert the deep import. Run once more — it must **pass**.

**Done when:** you have observed a pass, then a fail on the deep import, then a pass again. If step 2 does not fail, the rules are not wired correctly — fix before finishing.

### 8. Document and bind the convention

Write a `README.md` **in the packages folder** (`<packages-root>/README.md`), next to the packages it governs. Cover the `src/packages/<name>/` layout, entry points at the root, `lib/` for implementation, `tests/` for tests, "import only through a package's entry points (its root files)", and how to run `lint:boundaries`. **Discourage barrel files** explicitly. Expose several small entry points instead of re-exporting a whole subtree through one index. Keep it to the copy-me snippet plus the four rules in one paragraph each.

Then use the repository-contract branch selected in step 1:

- **Configured DOX:** create or update one binding invariant for the package boundary. If the resolution envelope identified the invariant, edit that specific record. Otherwise create it under the configured `records_dir`. Give it a stable `id`, one accountable `owner`, a non-empty body, and enough matching and binding evidence for the resolver to return it from either side of the boundary:

  ```yaml
  kind: invariant
  id: package-entrypoint-boundary
  owner: <accountable-owner>
  statement: Code outside a package imports it only through root entry-point files.
  paths: [.dependency-cruiser.cjs, package.json, <packages-root>/**]
  intents: [add package, import package]
  terms: [deep module, entry point, package boundary]
  state: enforced
  enforcement: [lint]
  enforced_by:
    - path: .dependency-cruiser.cjs
    - path: package.json
  depended_on_by:
    - path: <packages-root>/**
  verification: [<package-manager> run lint:boundaries]
  failure_modes: [external-deep-import, cross-package-deep-import, test-internal-import, dependency-cycle]
  impact: package-architecture
  criticality: high
  ```

  Replace the `owner` placeholder with one accountable owner. Keep an existing invariant's stable `id` when updating it. The example shows required binding evidence; the record also needs a non-empty Markdown body. Follow the installed `/dox` skill's maintenance policy and confirm complete delivery from both enforcement and dependent paths. Do not duplicate this contract in `AGENTS.md` or `CLAUDE.md`.
- **Unconfigured project:** add one context pointer to the packages README in the applicable `AGENTS.md`, creating the owning `AGENTS.md` only when a durable subtree boundary warrants one and indexing that child from its parent. For example: `Packages are deep modules; see [src/packages/README.md](./src/packages/README.md) before adding or importing one.`

**Done when:** the packages README exists and discourages barrels. In configured DOX, the binding invariant passes `dox lint` and resolves completely from enforcement and dependent paths. In an unconfigured project, the applicable `AGENTS.md` links to the README.

## Notes

- The config's `$1` back-references (dependency-cruiser's group matching) are what let a package reach its own internals while outsiders can't — don't flatten them into separate per-package rules.
- Public vs private is decided by **depth**: a package's root files are entry points; anything in a subfolder is private. The conventional subfolders are `lib/` (implementation) and `tests/`, but the rule doesn't hardcode them — any subfolder is private, so a new folder never needs a config change. Adding an entry point is just adding a root file — no barrel.
- Packages are **flat**: one tier of immediate children under the root. A package's internals may nest as deep as you like; a package may not contain another package.
- Use `.cjs` (not `.js`) so the config's `module.exports` works even in `"type": "module"` repos.
