// @ts-check
/**
 * Generates offline TypeScript type packs for the Monaco editor, derived
 * entirely from the real worker images in `images/`.
 *
 * For each unique worker directory it:
 *   1. reads the worker's own `package.json` (deps + devDeps),
 *   2. installs those dependencies (so we harvest the exact versions the
 *      student code runs against),
 *   3. walks the dependency closure collecting every `.d.ts` + `package.json`,
 *   4. writes `front/public/type-packs/<dir>/types.json`.
 *
 * The frontend loads these packs at runtime via `type-pack-loader.ts`, giving
 * students real IntelliSense (e.g. TeraORM / TypeORM model interfaces, Nest
 * decorators, Express, React) with zero network access at exam time.
 *
 * Usage:
 *   node scripts/build-type-packs.mjs           # all workers
 *   node scripts/build-type-packs.mjs nest.js   # a single worker dir
 */

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRONT_DIR = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(FRONT_DIR, "..");
const NODE_WORKERS_ROOT = path.join(REPO_ROOT, "images", "node");
const WORKER_DIR_OVERRIDES = new Map([
  [
    "javascript-default",
    path.join(REPO_ROOT, "images", "javascript-default"),
  ],
]);
const OUTPUT_ROOT = path.join(FRONT_DIR, "public", "type-packs");

const sourceMap = JSON.parse(
  fs.readFileSync(
    path.join(FRONT_DIR, "src", "lib", "monaco", "worker-source-map.json"),
    "utf8",
  ),
);

/** Unique worker directories referenced by the worker-source map. */
const allDirs = [...new Set(Object.values(sourceMap))];

const requestedDirs = process.argv.slice(2);
const targetDirs = requestedDirs.length
  ? allDirs.filter((dir) => requestedDirs.includes(dir))
  : allDirs;

if (!targetDirs.length) {
  console.error(`No matching worker dirs. Available: ${allDirs.join(", ")}`);
  process.exit(1);
}

/**
 * devDependencies that are pure build/test tooling. Their declaration files are
 * irrelevant to student code (and huge), so we never seed the closure from
 * them. `@types/*` packages are always kept regardless of this list.
 */
const TOOLING_DENYLIST = new Set([
  "typescript",
  "ts-node",
  "ts-jest",
  "ts-loader",
  "tsconfig-paths",
  "jest",
  "prettier",
  "eslint",
  "install",
  "source-map-support",
  "start-server-and-test",
  "supertest",
  "vite",
  "globals",
  "baseline-browser-mapping",
  "yargs",
  "yargs-parser",
  "cypress",
  "start-server-and-test",
]);

/**
 * Extra type-providing devDependencies worth keeping (test authoring helpers).
 */
const TOOLING_ALLOWLIST = new Set(["@jest/globals"]);

/**
 * @param {string} name
 */
function isToolingPackage(name) {
  if (name.startsWith("@types/")) return false;
  if (TOOLING_ALLOWLIST.has(name)) return false;
  if (TOOLING_DENYLIST.has(name)) return true;
  if (name.startsWith("@babel/")) return true;
  if (name.startsWith("@swc/")) return true;
  if (name.startsWith("@eslint/")) return true;
  if (name.startsWith("@nestjs/cli")) return true;
  if (name.startsWith("@nestjs/schematics")) return true;
  if (name.startsWith("eslint-")) return true;
  if (name.startsWith("typescript-eslint")) return true;
  if (name.startsWith("@vitejs/")) return true;
  return false;
}

/**
 * @param {string} dir
 * @returns {string[]} declared dependency names worth harvesting types for:
 * all runtime dependencies plus `@types/*` / test-authoring devDependencies.
 */
function readDeclaredDependencies(workerDir) {
  const pkgPath = path.join(workerDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const runtime = Object.keys(pkg.dependencies ?? {});
  const dev = Object.keys(pkg.devDependencies ?? {});
  return [...runtime, ...dev].filter((name) => !isToolingPackage(name));
}

/**
 * @param {string} workerDir absolute path to the worker directory
 */
function installDependencies(workerDir) {
  const hasNodeModules = fs.existsSync(path.join(workerDir, "node_modules"));
  if (hasNodeModules) {
    console.log(`  node_modules present, skipping install`);
    return;
  }
  console.log(`  installing dependencies (npm install)...`);
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--loglevel=error",
    ],
    { cwd: workerDir, stdio: "inherit", shell: process.platform === "win32" },
  );
}

/**
 * Resolves the on-disk directory for a package, preferring the worker's
 * top-level node_modules (npm hoists most deps there).
 * @param {string} workerDir
 * @param {string} pkgName
 * @returns {string | null}
 */
function resolvePackageDir(workerDir, pkgName) {
  const candidate = path.join(workerDir, "node_modules", pkgName);
  if (fs.existsSync(path.join(candidate, "package.json"))) {
    return candidate;
  }
  return null;
}

/**
 * @param {string} rootDir
 * @returns {string[]} absolute paths to every .d.ts under rootDir, excluding
 * nested node_modules (those are handled as separate packages).
 */
function collectDeclarationFiles(rootDir) {
  /** @type {string[]} */
  const results = [];
  /** @param {string} current */
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".d.ts")) {
        results.push(full);
      }
    }
  };
  walk(rootDir);
  return results;
}

/**
 * Builds the transitive closure of packages that provide types, starting from
 * the worker's declared dependencies.
 * @param {string} workerDir
 * @param {string[]} seeds
 * @returns {string[]} resolved package names
 */
function resolveDependencyClosure(workerDir, seeds) {
  const visited = new Set();
  const queue = [...seeds];

  while (queue.length) {
    const name = queue.shift();
    if (!name || visited.has(name) || isToolingPackage(name)) continue;
    visited.add(name);

    const pkgDir = resolvePackageDir(workerDir, name);
    if (!pkgDir) continue;

    // Allowlisted test tooling (e.g. @jest/globals) is kept as a leaf: we want
    // its own typings but not its huge transitive runtime closure.
    if (TOOLING_ALLOWLIST.has(name)) continue;

    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"),
      );
      // `@types/*` packages only ever depend on other `@types/*` packages worth
      // following; their occasional runtime deps (expect, pretty-format, ...)
      // drag in the whole jest/CLI universe, so we skip those.
      const typesOnly = name.startsWith("@types/");
      // Runtime + peer deps: peers (rxjs, reflect-metadata, typeorm for Nest)
      // carry the types student code interacts with, so follow them too.
      const deps = typesOnly
        ? Object.keys(pkg.dependencies ?? {})
        : [
            ...Object.keys(pkg.dependencies ?? {}),
            ...Object.keys(pkg.peerDependencies ?? {}),
          ];
      for (const dep of deps) {
        if (visited.has(dep) || isToolingPackage(dep)) continue;
        if (typesOnly && !dep.startsWith("@types/")) continue;
        queue.push(dep);
      }
      // Pull in the matching @types package when the dep ships no own types.
      if (!name.startsWith("@types/")) {
        const typesName = name.startsWith("@")
          ? `@types/${name.slice(1).replace("/", "__")}`
          : `@types/${name}`;
        if (!visited.has(typesName)) queue.push(typesName);
      }
    } catch {
      // Ignore malformed package.json.
    }
  }

  return [...visited];
}

/**
 * @param {string} dir worker directory name
 */
function buildPack(dir) {
  console.log(`\nBuilding type pack for "${dir}"`);
  const workerDir =
    WORKER_DIR_OVERRIDES.get(dir) ?? path.join(NODE_WORKERS_ROOT, dir);
  if (!fs.existsSync(workerDir)) {
    console.warn(`  worker dir not found, skipping: ${workerDir}`);
    return;
  }

  installDependencies(workerDir);

  const declared = readDeclaredDependencies(workerDir);
  const closure = resolveDependencyClosure(workerDir, declared);
  const nodeModulesDir = path.join(workerDir, "node_modules");

  /** @type {{ path: string; content: string }[]} */
  const entries = [];
  let missing = 0;

  for (const name of closure) {
    const pkgDir = resolvePackageDir(workerDir, name);
    if (!pkgDir) {
      missing += 1;
      continue;
    }

    // Always include package.json so the "types"/"exports" fields resolve.
    const files = [
      path.join(pkgDir, "package.json"),
      ...collectDeclarationFiles(pkgDir),
    ];

    for (const file of files) {
      const rel = path
        .relative(path.dirname(nodeModulesDir), file)
        .split(path.sep)
        .join("/");
      entries.push({ path: rel, content: fs.readFileSync(file, "utf8") });
    }
  }

  const outDir = path.join(OUTPUT_ROOT, dir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "types.json"),
    JSON.stringify(entries),
    "utf8",
  );

  const bytes = entries.reduce((sum, e) => sum + e.content.length, 0);
  console.log(
    `  wrote ${entries.length} files (${(bytes / 1024 / 1024).toFixed(1)} MB)` +
      (missing ? `, ${missing} packages unresolved` : ""),
  );
}

for (const dir of targetDirs) {
  buildPack(dir);
}

console.log("\nType packs built.");
