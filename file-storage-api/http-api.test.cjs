const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createHmac } = require("node:crypto");
const { Readable } = require("node:stream");
const { createServer } = require("./dist/server.js");
const { issueGrant } = require("./dist/grants.js");
const { hash } = require("./dist/store.js");

const secret = "local-synthetic-storage-secret-do-not-use-in-production";
const scope = "eevee-u1-a1";

async function fixture(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "eevee-storage-http-"));
  const { server, store } = createServer({ root, secret, ...options });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()),
    );
    fs.rmSync(root, { recursive: true, force: true });
  });

  const origin = `http://127.0.0.1:${server.address().port}`;
  const token = issueGrant(secret, scope);
  const request = (pathname, init = {}, grant = token) =>
    fetch(`${origin}/v1${pathname}`, {
      ...init,
      headers: { Authorization: `Bearer ${grant}`, ...init.headers },
    });
  return { origin, request, store, token };
}

test("authorizes each scope, preserves revision checks and restricts worker bundles", async (t) => {
  const { request, store, token } = await fixture(t);
  const bytes = Buffer.from("synthetic source");
  const id = hash(bytes);
  const uploaded = await request(`/${scope}/blobs/${id}`, {
    method: "PUT",
    body: bytes,
  });
  assert.equal(uploaded.status, 200);
  assert.equal((await request(`/${scope}/blobs/${id}`, {}, "")).status, 403);
  assert.equal(
    (
      await request(
        `/${scope}/blobs/${id}`,
        {},
        issueGrant(secret, scope, ["read"], -1),
      )
    ).status,
    403,
  );
  assert.equal(
    (await request(`/${scope}/blobs/${id}`, {}, token + "x")).status,
    403,
  );
  assert.equal((await request(`/eevee-u2-a1/blobs/${id}`)).status, 403);
  assert.equal(
    (
      await request(
        `/eevee-u2-a1/blobs/${id}`,
        {},
        issueGrant(secret, "eevee-u2-a1"),
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await request(
        `/${scope}/blobs/${id}`,
        { method: "PUT", body: bytes },
        issueGrant(secret, scope, ["read"]),
      )
    ).status,
    403,
  );
  assert.equal(
    (await request(`/${scope}/workspace`, { method: "PUT", body: "{}" }))
      .status,
    428,
  );
  const init = {
    method: "PUT",
    headers: { "If-Match": "0" },
    body: JSON.stringify({
      files: { "main.ts": { digest: id, size: bytes.length } },
    }),
  };
  const results = await Promise.all([
    request(`/${scope}/workspace`, init),
    request(`/${scope}/workspace`, init),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const snapshot = await (
    await request(`/${scope}/snapshots`, {
      method: "POST",
      body: JSON.stringify({ revision: 1, kind: "submission" }),
    })
  ).json();
  const encoded = Buffer.from(JSON.stringify({
    aud: "eevee-file-storage-v1",
    scope,
    snapshotId: snapshot.id,
    permissions: ["read"],
    exp: Math.floor(Date.now() / 1000) + 60,
  })).toString("base64url");
  const workerToken = `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;
  const bundlePath = `/${scope}/snapshots/${snapshot.id}/files`;
  const bundle = await request(bundlePath, {}, workerToken);
  assert.equal(bundle.status, 200);
  assert.deepEqual(await bundle.json(), {
    manifest: snapshot,
    files: { "main.ts": bytes.toString("base64") },
  });
  assert.equal((await request(bundlePath)).status, 403);
  assert.equal((await request(`/${scope}/workspace`, {}, workerToken)).status, 403);
  assert.equal((await request(`/${scope}/blobs/${id}`, {}, workerToken)).status, 403);
  assert.equal((await request(`/${scope}/snapshots/${"0".repeat(64)}/files`, {}, workerToken)).status, 403);
  assert.equal(
    (
      await request(
        `/eevee-u2-a1/snapshots/${snapshot.id}`,
        {},
        issueGrant(secret, "eevee-u2-a1"),
      )
    ).status,
    404,
  );
  const localEdits = { "main.ts": "unsynced offline edit" };
  assert.throws(() => store.saveWorkspace(scope, 0, {}), { status: 409 });
  assert.equal(localEdits["main.ts"], "unsynced offline edit");
});

test("serves readiness, preflight, and blob headers", async (t) => {
  const { origin, request, store } = await fixture(t);
  const health = await fetch(`${origin}/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");

  const browserOrigin = "http://localhost:3000";
  const preflight = await request(`/${scope}/workspace`, {
    method: "OPTIONS",
    headers: { Origin: browserOrigin },
  }, "");
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), browserOrigin);
  assert.match(preflight.headers.get("Access-Control-Allow-Headers"), /If-Match/);
  const blocked = await request(`/${scope}/workspace`, {
    headers: { Origin: "https://untrusted.example" },
  });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.headers.get("Access-Control-Allow-Origin"), null);

  const bytes = Buffer.from("synthetic source");
  const id = hash(bytes);
  store.putBlob(scope, id, bytes);
  const head = await request(`/${scope}/blobs/${id}`, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("Content-Length"), String(bytes.length));
  assert.equal(head.headers.get("Cache-Control"), "no-store");
  assert.equal((await head.arrayBuffer()).byteLength, 0);
});

test("enforces the configured workspace and snapshot JSON limits", async (t) => {
  const workspaceBody = '{"files":{}}'.padEnd(64 * 1024 + 1);
  const snapshotBody = JSON.stringify({ revision: 1, kind: "submission" });
  const { request } = await fixture(t, {
    bodyLimits: {
      workspaceBodyBytes: Buffer.byteLength(workspaceBody),
      snapshotBodyBytes: Buffer.byteLength(snapshotBody),
    },
  });

  const save = (body) => request(`/${scope}/workspace`, {
    method: "PUT",
    headers: { "If-Match": "0" },
    body,
  });
  assert.equal((await save(workspaceBody + " ")).status, 413);
  assert.equal((await save(workspaceBody)).status, 200);

  const snapshot = (body) => request(`/${scope}/snapshots`, { method: "POST", body });
  assert.equal((await snapshot(snapshotBody + " ")).status, 413);
  assert.equal((await snapshot(snapshotBody)).status, 201);
});

test("rejects invalid JSON and oversized uploads without changing storage", async (t) => {
  const limits = { maxFileBytes: 16, maxProjectBytes: 64 };
  const { request, store } = await fixture(t, { storageLimits: limits });
  for (const body of ["null", "[]", "{"]) {
    const response = await request(`/${scope}/workspace`, {
      method: "PUT",
      headers: { "If-Match": "0" },
      body,
    });
    assert.equal(response.status, 400);
  }
  assert.equal(store.workspace(scope).revision, 0);

  const workspace = await request(`/${scope}/workspace`);
  assert.deepEqual((await workspace.json()).limits, limits);
  const bytes = Buffer.alloc(limits.maxFileBytes + 1);
  const id = hash(bytes);
  const blob = `/${scope}/blobs/${id}`;
  const sized = await request(blob, { method: "PUT", body: bytes });
  assert.equal(sized.status, 413);
  assert.deepEqual(await sized.json(), { error: "Request too large" });

  const chunked = await request(blob, {
    method: "PUT",
    body: Readable.from([
      bytes.subarray(0, limits.maxFileBytes),
      bytes.subarray(limits.maxFileBytes),
    ]),
    duplex: "half",
  });
  assert.equal(chunked.status, 413);
  assert.deepEqual(await chunked.json(), { error: "Request too large" });
  assert.equal((await request(blob)).status, 404);
});
