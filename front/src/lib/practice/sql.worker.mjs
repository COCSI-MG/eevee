import { PGlite } from "./runtime/index.js";
let db;
const MAX_ROWS = 200;
function bounded(results) {
  let remaining = 64000;
  return results.slice(0, 10).map((result) => {
    const rows = [];
    for (const row of result.rows.slice(0, MAX_ROWS)) {
      const size = JSON.stringify(row).length;
      if (size > remaining) break;
      remaining -= size;
      rows.push(row);
    }
    return {
      rows,
      fields: result.fields.map((f) => ({ name: f.name })),
      affectedRows: result.affectedRows,
      truncated: rows.length < result.rows.length,
    };
  });
}
self.onmessage = async ({ data }) => {
  try {
    if (data.action === "init") {
      db = new PGlite();
      await db.waitReady;
      await db.exec("SET statement_timeout = '5s';");
      await db.exec(data.sql);
      self.postMessage({ ok: true, results: [] });
    } else if (data.action === "run") {
      self.postMessage({ ok: true, results: bounded(await db.exec(data.sql)) });
    } else if (data.action === "check") {
      const result = await db.query(data.sql);
      const canonical = (value) =>
        Array.isArray(value)
          ? value.map(canonical)
          : value && typeof value === "object"
            ? Object.fromEntries(
                Object.keys(value)
                  .sort()
                  .map((k) => [k, canonical(value[k])]),
              )
            : value;
      const correct =
        JSON.stringify(canonical(result.rows)) ===
        JSON.stringify(canonical(JSON.parse(data.expectedRows)));
      self.postMessage({ ok: true, correct, results: [] });
    }
  } catch (error) {
    self.postMessage({
      ok: false,
      error: String(error?.message || "Falha na execução SQL.").slice(0, 2000),
    });
  }
};
