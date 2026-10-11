import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Worker } from "node:worker_threads";
import ts from "typescript";

// Exercise the actual worker module with the real packaged PostgreSQL engine.
const source = await readFile(
  new URL("../src/lib/practice/sql.worker.mjs", import.meta.url),
  "utf8",
);
const runtime = new URL(
  "../node_modules/@electric-sql/pglite/dist/index.js",
  import.meta.url,
).href;
const presetsSource = await readFile(
  new URL("../src/lib/practice/presets.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(presetsSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { sqlPractice } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const config = sqlPractice();
const bootstrap = `import { parentPort } from 'node:worker_threads';
globalThis.self = { postMessage: data => parentPort.postMessage(data) };
await import('data:text/javascript;base64,${Buffer.from(source.replace(/["']\.\/runtime\/index\.js["']/, JSON.stringify(runtime))).toString("base64")}');
parentPort.on('message', data => self.onmessage({ data }));`;
const spawn = () =>
  new Worker(
    new URL(
      `data:text/javascript;base64,${Buffer.from(bootstrap).toString("base64")}`,
    ),
  );
let worker = spawn();
function request(data) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("SQL worker timeout"));
    }, 30000);
    const message = (value) => {
      clearTimeout(timeout);
      worker.off("error", error);
      resolve(value);
    };
    const error = (value) => {
      clearTimeout(timeout);
      worker.off("message", message);
      reject(value);
    };
    worker.once("message", message);
    worker.once("error", error);
    worker.postMessage(data);
  });
}
const check = (task) =>
  request({
    action: "check",
    sql: task.checkSql,
    expectedRows: task.expectedRows,
  });
const run = (sql) => request({ action: "run", sql });
try {
  assert.equal(
    (await request({ action: "init", sql: config.setupSql })).ok,
    true,
  );
  assert.equal((await check(config.tasks[0])).correct, false);
  assert.equal(
    (
      await run(
        "UPDATE funcionarios SET salario = salario * 1.1 WHERE departamento = 'TI';",
      )
    ).ok,
    true,
  );
  assert.equal((await check(config.tasks[0])).correct, true);
  assert.equal((await run("INVALID SQL")).ok, false);
  assert.equal((await run("SELECT count(*) FROM funcionarios")).ok, true);
  const many = await run("SELECT generate_series(1, 1000) AS n");
  assert.equal(many.results[0].rows.length, 200);
  assert.equal(many.results[0].truncated, true);
  await worker.terminate();
  worker = spawn();
  await request({ action: "init", sql: config.setupSql });
  assert.equal(
    (await check(config.tasks[0])).correct,
    false,
    "Reset must discard old changes",
  );
  await run("INSERT INTO funcionarios VALUES (4, 'Diego', 'RH', 3500)");
  assert.equal((await check(config.tasks[1])).correct, true);
  await run("DELETE FROM funcionarios WHERE id = 4");
  await run("DELETE FROM funcionarios WHERE departamento = 'RH'");
  assert.equal((await check(config.tasks[2])).correct, true);
  await worker.terminate();
  worker = spawn();
  await request({ action: "init", sql: config.setupSql });
  await run("BEGIN; UPDATE funcionarios SET salario = 0; ROLLBACK;");
  assert.equal((await check(config.tasks[3])).correct, true);
  console.log(
    "SQL runtime passed: guided INSERT/UPDATE/DELETE/ROLLBACK, error recovery, row limits, isolated reset.",
  );
} finally {
  await worker.terminate();
}
