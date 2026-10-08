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
