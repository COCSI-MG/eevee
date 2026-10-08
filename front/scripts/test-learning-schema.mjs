import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";
const source = await readFile(
  new URL(
    "../../platform-api/src/migrations/1790179200000-LearningActivities.ts",
    import.meta.url,
  ),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { LearningActivities1790179200000 } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const db = new PGlite();
try {
  await db.exec(
    'CREATE TABLE class(id integer PRIMARY KEY); CREATE TABLE "user"(id integer PRIMARY KEY); INSERT INTO class VALUES (1); INSERT INTO "user" VALUES (1);',
  );
  const migration = new LearningActivities1790179200000();
  const adapter = { query: (sql) => db.exec(sql) };
  await migration.up(adapter);
  await db.exec(`INSERT INTO learning_activity ("classId",kind,title,description) VALUES (1,'quiz','Test','');
    INSERT INTO learning_quiz_attempt ("activityId","userId",attempt,answers,score) VALUES (1,1,1,'[]',1);`);
  await assert.rejects(
    db.exec(
      `INSERT INTO learning_quiz_attempt ("activityId","userId",attempt,answers,score) VALUES (1,1,1,'[]',1)`,
    ),
    /duplicate/,
  );
  await assert.rejects(
    db.exec("DELETE FROM learning_activity WHERE id=1"),
    /foreign key/,
  );
  await assert.rejects(
    db.exec(
      `INSERT INTO learning_quiz_attempt ("activityId","userId",attempt,answers,score) VALUES (1,99,2,'[]',1)`,
    ),
    /foreign key/,
  );
  await migration.down(adapter);
  const tables = await db.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public'",
  );
  assert.equal(tables.rows.length, 2);
  console.log(
    "Learning migration passed: up/down, enrollment references, unique attempt numbers and retained submissions.",
  );
} finally {
  await db.close();
}
