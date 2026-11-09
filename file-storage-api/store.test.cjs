const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  Store,
  hash,
  DEFAULT_STORAGE_LIMITS,
} = require("./dist/store.js");
const { backup, restore } = require("./dist/backup.js");
const scope = "eevee-u1-a1";
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "eevee-storage-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, store: new Store(path.join(root, "primary")) };
}
function upload(store, content = "export const answer = 42;\n") {
  const bytes = Buffer.from(content);
  const id = hash(bytes);
  store.putBlob(scope, id, bytes);
  return { digest: id, size: bytes.length };
}
function error(status) {
  return (e) => e.status === status;
}
test("hash integrity, deduplication, UTF-8 byte limits and nested path validation", (t) => {
  const { store } = fixture(t);
  const ref = upload(store, "olá 🌍");
  assert.equal(ref.size, Buffer.byteLength("olá 🌍"));
  assert.equal(
    store.putBlob(scope, ref.digest, Buffer.from("olá 🌍")).deduplicated,
    true,
  );
  assert.throws(
    () => store.putBlob(scope, ref.digest, Buffer.from("tamper")),
    error(422),
  );
  const big = Buffer.alloc(DEFAULT_STORAGE_LIMITS.maxFileBytes + 1);
  assert.throws(() => store.putBlob(scope, hash(big), big), error(413));
  for (const name of [
    "../x",
    "/x",
    "x/../y",
    "x\\y",
    "x\0y",
    "x//y",
    "./x",
    "C:/x",
  ])
    assert.throws(
      () => store.saveWorkspace(scope, 0, { [name]: ref }),
      error(400),
    );
  assert.equal(
    store.saveWorkspace(scope, 0, { "src/nested/main.ts": ref }).revision,
    1,
  );
});
test("immutable submissions and previews survive edits, deletions and stale CAS", (t) => {
  const { store } = fixture(t);
  const first = upload(store);
  store.saveWorkspace(scope, 0, { "src/main.ts": first });
  const submission = store.snapshot(scope, 1, "submission");
  const preview = store.snapshot(scope, 1, "preview");
  assert.notEqual(submission.id, preview.id);
  assert.equal(store.snapshot(scope, 1, "submission").id, submission.id);
  const second = upload(store, "export const answer = 43;");
  store.saveWorkspace(scope, 1, { "src/other.ts": second });
  assert.deepEqual(
    store.getSnapshot(scope, submission.id).files["src/main.ts"],
    first,
  );
  assert.throws(
    () => store.saveWorkspace(scope, 1, { "local.ts": first }),
    error(409),
  );
  assert.throws(() => store.snapshot(scope, 1, "submission"), error(409));
  assert.equal(store.workspace(scope).revision, 2);
});
test("project byte/file count limits are enforced", (t) => {
  const { store } = fixture(t);
  const bytes = Buffer.alloc(DEFAULT_STORAGE_LIMITS.maxFileBytes);
  const ref = upload(store, bytes);
  const files = Object.fromEntries(
    Array.from({ length: 6 }, (_, i) => [`f${i}`, ref]),
  );
  assert.throws(() => store.saveWorkspace(scope, 0, files), error(413));
  const tiny = upload(store, "x");
  assert.throws(
    () =>
      store.saveWorkspace(
        scope,
        0,
        Object.fromEntries(
          Array.from({ length: 101 }, (_, i) => [`f${i}`, tiny]),
        ),
      ),
    error(400),
  );
});
test("lower quotas apply to new saves while existing workspaces and snapshots stay readable", (t) => {
  const { store } = fixture(t);
  const ref = upload(store, "12345678");
  const files = { "a.ts": ref, "b.ts": ref };
  store.saveWorkspace(scope, 0, files);
  const snapshot = store.snapshot(scope, 1, "submission");

  const reduced = new Store(store.root, { maxFileBytes: 7, maxProjectBytes: 12 });
  assert.deepEqual(reduced.workspace(scope).files, files);
  assert.deepEqual(reduced.getSnapshot(scope, snapshot.id), store.getSnapshot(scope, snapshot.id));
  assert.doesNotThrow(() => reduced.verify());
  assert.throws(() => reduced.saveWorkspace(scope, 1, files), error(413));
  const smaller = upload(reduced, "1234567");
  assert.throws(
    () => reduced.saveWorkspace(scope, 1, { "a.ts": smaller, "b.ts": smaller }),
    error(413),
  );
  assert.equal(reduced.saveWorkspace(scope, 1, { "a.ts": smaller }).revision, 2);
});

test("backup/restore verifies bytes, snapshots, missing files, tampering and non-destructive targets", (t) => {
  const { root, store } = fixture(t);
  const ref = upload(store);
  store.saveWorkspace(scope, 0, { "src/main.ts": ref });
  const snapshot = store.snapshot(scope, 1, "submission");
  const backupDir = path.join(root, "backup");
  backup(store, backupDir);
  const restored = restore(backupDir, path.join(root, "restored"));
  assert.deepEqual(
    restored.getSnapshot(scope, snapshot.id),
    store.getSnapshot(scope, snapshot.id),
  );
  assert.deepEqual(
    restored.getBlob(scope, ref.digest),
    store.getBlob(scope, ref.digest),
  );
  assert.throws(() => restore(backupDir, restored.root), error(409));
  assert.throws(
    () => backup(store, path.join(store.root, "nested")),
    error(400),
  );
  const blob = path.join(
    backupDir,
    "data",
    "scopes",
    scope,
    "blobs",
    ref.digest,
  );
  fs.writeFileSync(blob, "corrupt");
  const destination = path.join(root, "bad-restored");
  assert.throws(() => restore(backupDir, destination), error(422));
  assert.equal(fs.existsSync(destination), false);
  fs.rmSync(blob);
  assert.throws(() => restore(backupDir, destination), error(422));
});
test("backup fails closed for corrupt primary and interrupted partial backup", (t) => {
  const { root, store } = fixture(t);
  const ref = upload(store);
  store.saveWorkspace(scope, 0, { "x.ts": ref });
  store.snapshot(scope, 1, "submission");
  fs.writeFileSync(path.join(store.root, "scopes", scope, "blobs", ref.digest), "bad");
  const dest = path.join(root, "unpublished");
  assert.throws(() => backup(store, dest), error(422));
  assert.equal(fs.existsSync(dest), false);
  fs.mkdirSync(path.join(root, "interrupted.partial", "data"), {
    recursive: true,
  });
  assert.throws(() =>
    restore(
      path.join(root, "interrupted.partial"),
      path.join(root, "restored"),
    ),
  );
  assert.equal(fs.existsSync(path.join(root, "restored")), false);
});
test("same-host replica is a verified copy, not independent disaster recovery", (t) => {
  const { root, store } = fixture(t);
  const ref = upload(store);
  store.saveWorkspace(scope, 0, { "x.ts": ref });
  const one = store.snapshot(scope, 1, "submission");
  backup(store, path.join(root, "checkpoint1"));
  const replica = restore(
    path.join(root, "checkpoint1"),
    path.join(root, "replica1"),
  );
  store.saveWorkspace(scope, 1, {});
  assert.equal(replica.workspace(scope).revision, 1);
  assert.equal(replica.getSnapshot(scope, one.id).id, one.id);
});
test("empty workspace backs up and restores; file/directory collisions fail closed", (t) => {
  const { root, store } = fixture(t);
  store.saveWorkspace(scope, 0, {});
  const empty = store.snapshot(scope, 1, "submission");
  backup(store, path.join(root, "empty-backup"));
  const restored = restore(
    path.join(root, "empty-backup"),
    path.join(root, "empty-restored"),
  );
  assert.deepEqual(restored.getSnapshot(scope, empty.id).files, {});
  const ref = upload(store);
  assert.throws(
    () => store.saveWorkspace(scope, 1, { a: ref, "a/b": ref }),
    error(400),
  );
  assert.throws(
    () => store.saveWorkspace(scope, 1, { "a/b/c": ref, "a/b": ref }),
    error(400),
  );
});

test("idempotent snapshot creation rejects corrupt existing bytes", (t) => {
  const { store } = fixture(t);
  const ref = upload(store);
  store.saveWorkspace(scope, 0, { "app.ts": ref });
  const snapshot = store.snapshot(scope, 1, "submission");
  fs.writeFileSync(
    path.join(store.root, "scopes", scope, "snapshots", snapshot.id),
    "corrupt",
  );
  assert.throws(() => store.snapshot(scope, 1, "submission"), error(422));
});

test("reads the v1 workspace and snapshot format written before the TypeScript build", (t) => {
  const { store } = fixture(t);
  const file = upload(store, "legacy source");
  const workspace = { version: 1, scope, revision: 1, files: { "src/app.ts": file } };
  const snapshot = { version: 1, scope, revision: 1, kind: "submission", files: workspace.files };
  const bytes = JSON.stringify(snapshot);
  const id = hash(bytes);
  const directory = path.join(store.root, "scopes", scope);
  fs.mkdirSync(path.join(directory, "snapshots"));
  fs.writeFileSync(path.join(directory, "workspace.json"), JSON.stringify(workspace));
  fs.writeFileSync(path.join(directory, "snapshots", id), bytes);

  assert.deepEqual(store.workspace(scope), workspace);
  assert.equal(JSON.stringify(store.getSnapshot(scope, id)), JSON.stringify({ id, ...snapshot }));
});
