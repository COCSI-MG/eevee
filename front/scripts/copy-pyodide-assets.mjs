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
await mkdir(destination, { recursive: true });
for (const file of ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"]) {
  await copyFile(join(runtime, file), join(destination, file));
}

// Build-time download only. Browsers never contact PyPI or a runtime CDN.
const wheel = "pyflakes-3.4.0-py2.py3-none-any.whl";
const digest = "f742a7dbd0d9cb9ea41e9a24a918996e8170c799fa528688d40dd582c8265f4f";
const valid = (bytes) => createHash("sha256").update(bytes).digest("hex") === digest;
let bytes = await readFile(join(destination, wheel)).catch(() => null);
if (!bytes || !valid(bytes)) {
  const response = await fetch(`https://files.pythonhosted.org/packages/c2/2f/81d580a0fb83baeb066698975cb14a618bdbed7720678566f1b046a95fe8/${wheel}`, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Pyflakes download failed: ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
  if (!valid(bytes)) throw new Error("Pyflakes checksum mismatch");
  await writeFile(join(destination, wheel), bytes);
}
const source = join(root, "src/lib/monaco/python");
await copyFile(join(source, "checker.py"), join(destination, "checker.py"));
const worker = ts.transpileModule(await readFile(join(source, "pyodide-worker.ts"), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
await writeFile(join(destination, "worker.js"), worker);
console.log(`Prepared self-hosted Python tools in public/pyodide/${version}`);

// Semantic Python packages are version-pinned and served from our own origin.
const lock = JSON.parse(await readFile(join(runtime, "pyodide-lock.json"), "utf8"));
const packages = ["jedi", "parso"].map(name => ({ file: lock.packages[name].file_name, sha: lock.packages[name].sha256, url: `https://cdn.jsdelivr.net/pyodide/v${version}/full/${lock.packages[name].file_name}` }));
packages.push({ file: "pandas_stubs-3.1.0.261029-py3-none-any.whl", sha: "70f631f2d0781c4500b1cd5f84cab7d7279a3d114674d69655536a4a99a3a67f", url: "https://files.pythonhosted.org/packages/c0/2c/ecbc04b2a8d05d737351a54398f843223cb66edf42ec5c0fcc6198f17d3a/pandas_stubs-3.1.0.261029-py3-none-any.whl" });
for (const pkg of packages) {
  let data = await readFile(join(destination, pkg.file)).catch(() => null);
  const matches = value => value && createHash("sha256").update(value).digest("hex") === pkg.sha;
  if (!matches(data)) {
    const response = await fetch(pkg.url, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Python asset ${pkg.file}: HTTP ${response.status}`);
    data = Buffer.from(await response.arrayBuffer());
    if (!matches(data)) throw new Error(`Checksum mismatch: ${pkg.file}`);
    await writeFile(join(destination, pkg.file), data);
  }
}
await copyFile(join(source, "semantic.py"), join(destination, "semantic.py"));
await writeFile(join(destination, "semantic-worker.js"), ts.transpileModule(await readFile(join(source, "semantic-worker.ts"), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
