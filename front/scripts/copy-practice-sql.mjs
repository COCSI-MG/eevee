import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readdir, copyFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const source = dirname(require.resolve("@electric-sql/pglite"));
const destination = join(root, "public/practice-sql/runtime");
await mkdir(destination, { recursive: true });
for (const file of await readdir(source)) {
  if (/\.(js|wasm|data)$/.test(file))
    await copyFile(join(source, file), join(destination, file));
}
await copyFile(
  join(root, "src/lib/practice/sql.worker.mjs"),
  join(root, "public/practice-sql/worker.mjs"),
);
await copyFile(join(source, "../LICENSE"), join(destination, "LICENSE"));
console.log("Prepared local PostgreSQL practice assets.");
