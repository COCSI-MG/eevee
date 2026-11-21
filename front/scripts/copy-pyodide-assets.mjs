import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const runtime = dirname(require.resolve("pyodide/package.json"));
const { version } = JSON.parse(await readFile(join(runtime, "package.json"), "utf8"));
const destination = join(root, "public", "pyodide", version);
const assetLockPath = join(root, "python-assets.lock.json");
const assetLock = JSON.parse(await readFile(assetLockPath, "utf8"));
if (assetLock.pyodideVersion !== version) {
  throw new Error(`Python asset lock requires Pyodide ${assetLock.pyodideVersion}; installed ${version}`);
}
const pyodideLock = JSON.parse(await readFile(join(runtime, "pyodide-lock.json"), "utf8"));
for (const name of ["jedi", "parso"]) {
  const entry = pyodideLock.packages[name];
  const pinned = assetLock.packages[name];
  if (!entry || !pinned || entry.file_name !== pinned.file || entry.sha256 !== pinned.sha256) {
    throw new Error(`Python asset lock disagrees with Pyodide about ${name}`);
  }
}
await mkdir(destination, { recursive: true });
for (const file of ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"]) {
  await copyFile(join(runtime, file), join(destination, file));
}

// The build fetches and verifies all wheels; browsers use only local copies.
async function ensurePackage(name, { file, sha256, url }) {
  if (!file || file.includes('/') || file.includes('\\') || !/^[a-f0-9]{64}$/.test(sha256) || !url.startsWith('https://')) {
    throw new Error(`Invalid locked Python asset: ${name}`);
  }
  const path = join(destination, file);
  const matches = (bytes) => bytes && createHash("sha256").update(bytes).digest("hex") === sha256;
  let bytes = await readFile(path).catch(() => null);
  if (matches(bytes)) return;
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Python asset ${name}: HTTP ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
  if (!matches(bytes)) throw new Error(`Checksum mismatch: ${file}`);
  await writeFile(path, bytes);
}
for (const name of ["pyflakes", "jedi", "parso", "pandas-stubs"]) {
  if (!assetLock.packages[name]) throw new Error(`Missing locked Python asset: ${name}`);
  await ensurePackage(name, assetLock.packages[name]);
}
// Workers consume local filenames from the same project-owned lock.
await copyFile(assetLockPath, join(destination, "python-assets.lock.json"));
const source = join(root, "src/lib/monaco/python");
await copyFile(join(source, "checker.py"), join(destination, "checker.py"));
const worker = ts.transpileModule(await readFile(join(source, "pyodide-worker.ts"), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
await writeFile(join(destination, "worker.js"), worker);
await copyFile(join(source, "semantic.py"), join(destination, "semantic.py"));
// Workers are standalone browser modules, so transpile them to ES modules
// separately from the Next.js application bundle, like the lint worker above.
const semanticWorker = ts.transpileModule(
  await readFile(join(source, "semantic-worker.ts"), "utf8"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } },
).outputText;
await writeFile(join(destination, "semantic-worker.js"), semanticWorker);
console.log(`Prepared self-hosted Python tools in public/pyodide/${version}`);
