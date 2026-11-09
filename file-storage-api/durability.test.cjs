const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");
const { createDurability } = require("./dist/durability.js");

// Fault-injection protocol tests: directory flushes are simulated explicitly.
// Passing these is not evidence of native Windows crash durability.
function fixture(t, inject = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "eevee-durability-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const handles = new Map();
  const events = [];
  const io = {
    ...fs,
    openSync(name, ...args) {
      const fd = fs.openSync(name, ...args);
      handles.set(fd, name);
      return fd;
    },
    closeSync(fd) {
      fs.closeSync(fd);
      handles.delete(fd);
    },
    fsyncSync(fd) {
      events.push(["sync", handles.get(fd)]);
    },
    renameSync(from, to) {
      events.push(["rename", to]);
      fs.renameSync(from, to);
    },
    ...inject,
  };
  return { root, events, io, writer: createDurability(io, "linux") };
}
test("unsupported Windows is rejected before any filesystem operation", () => {
  let calls = 0;
  const io = new Proxy(
    {},
    {
      get() {
        calls++;
        throw Error("must not touch disk");
      },
    },
  );
  assert.throws(() => createDurability(io, "win32").atomic("unused", "x"), {
    code: "ERR_STORAGE_DURABILITY_UNSUPPORTED",
  });
  assert.equal(calls, 0);
});
test("filesystem preflight failure leaves destination absent", (t) => {
  const f = fixture(t, {
    fsyncSync() {
      throw Object.assign(Error("flush denied"), { code: "EPERM" });
    },
  });
  const dest = path.join(f.root, "new", "blob");
  assert.throws(() => f.writer.atomic(dest, "x"), { code: "EPERM" });
  assert.equal(fs.existsSync(path.dirname(dest)), false);
});
test("failed file flush cleans own temporary file and preserves old data", (t) => {
  const f = fixture(t);
  const dest = path.join(f.root, "blob");
  fs.writeFileSync(dest, "old");
  const original = f.io.fsyncSync;
  f.io.fsyncSync = (fd) => {
    if (!fs.fstatSync(fd).isDirectory())
      throw Object.assign(Error("file flush"), { code: "EIO" });
    original(fd);
  };
  assert.throws(() => f.writer.atomic(dest, "new"), { code: "EIO" });
  assert.equal(fs.readFileSync(dest, "utf8"), "old");
  assert.deepEqual(fs.readdirSync(f.root), ["blob"]);
});
test("failed rename preserves target and removes only operation temporary", (t) => {
  const f = fixture(t, {
    renameSync() {
      throw Object.assign(Error("rename"), { code: "EACCES" });
    },
  });
  const dest = path.join(f.root, "blob");
  fs.writeFileSync(dest, "old");
  assert.throws(() => f.writer.atomic(dest, "new"), { code: "EACCES" });
  assert.equal(fs.readFileSync(dest, "utf8"), "old");
  assert.deepEqual(fs.readdirSync(f.root), ["blob"]);
});
test("post-rename flush failure is explicitly an uncertain persisted outcome", (t) => {
  const f = fixture(t);
  const sync = f.io.fsyncSync;
  let renamed = false;
  f.io.renameSync = (a, b) => {
    fs.renameSync(a, b);
    renamed = true;
  };
  f.io.fsyncSync = (fd) => {
    if (renamed) throw Object.assign(Error("late flush"), { code: "EIO" });
    sync(fd);
  };
  const dest = path.join(f.root, "blob");
  assert.throws(
    () => f.writer.atomic(dest, "new"),
    (e) => e.code === "EIO" && e.persistenceUncertain === true,
  );
  assert.equal(fs.readFileSync(dest, "utf8"), "new");
});
test("ancestor entries and final rename are flushed in order", (t) => {
  const f = fixture(t);
  const dest = path.join(f.root, "scopes", "scope", "blobs", "id");
  f.writer.atomic(dest, "bytes");
  const dirs = f.events
    .filter(([kind]) => kind === "sync")
    .map(([, name]) => name);
  for (const directory of [
    f.root,
    path.join(f.root, "scopes"),
    path.join(f.root, "scopes", "scope"),
  ])
    assert.ok(dirs.includes(directory));
  assert.deepEqual(f.events.slice(-2), [
    ["rename", dest],
    ["sync", path.dirname(dest)],
  ]);
});
test(
  "Store startup on Windows creates no misleading partial root",
  { skip: process.platform !== "win32" },
  (t) => {
    const { root } = fixture(t);
    const dest = path.join(root, "unsupported");
    const { Store } = require("./dist/store.js");
    assert.throws(() => new Store(dest), {
      code: "ERR_STORAGE_DURABILITY_UNSUPPORTED",
    });
    assert.equal(fs.existsSync(dest), false);
  },
);

test("retrying an existing directory flushes its parent after earlier mkdir failure", (t) => {
  const f = fixture(t);
  const sync = f.io.fsyncSync;
  let fail = true;
  const dir = path.join(f.root, "new");
  f.io.fsyncSync = (fd) => {
    if (fail && fs.existsSync(dir)) {
      fail = false;
      throw Object.assign(Error("parent flush"), { code: "EIO" });
    }
    sync(fd);
  };
  assert.throws(() => f.writer.mkdir(dir), { code: "EIO" });
  assert.ok(fs.existsSync(dir));
  f.writer.mkdir(dir);
  assert.ok(
    f.events.some(([kind, name]) => kind === "sync" && name === f.root),
  );
});
test("idempotent success reflushes existing file and its directory", (t) => {
  const f = fixture(t);
  const dest = path.join(f.root, "blob");
  fs.writeFileSync(dest, "new");
  f.writer.syncExisting(dest);
  assert.deepEqual(f.events.slice(-2), [
    ["sync", dest],
    ["sync", f.root],
  ]);
  f.io.fsyncSync = () => {
    throw Object.assign(Error("flush failure"), { code: "EIO" });
  };
  assert.throws(() => f.writer.syncExisting(dest), { code: "EIO" });
});

test("blob and snapshot retries cannot acknowledge an unflushed existing object", (t) => {
  const vm = require("node:vm");
  const f = fixture(t);
  const writer = f.writer;
  const module = { exports: {} };
  const storePath = path.join(__dirname, "dist", "store.js");
  const requireFromStore = createRequire(storePath);
  vm.runInNewContext(
    fs.readFileSync(storePath, "utf8"),
    {
      require(name) {
        return name === "./durability" ? writer : requireFromStore(name);
      },
      module,
      exports: module.exports,
      Buffer,
    },
    { filename: storePath },
  );
  const { Store, hash } = module.exports;
  const store = new Store(path.join(f.root, "data"));
  const scope = "retry-scope";
  const bytes = Buffer.from("synthetic");
  const id = hash(bytes);
  const rename = f.io.renameSync;
  const sync = f.io.fsyncSync;
  let failAfterRename = true;
  let published = false;
  f.io.renameSync = (a, b) => {
    rename(a, b);
    published = true;
  };
  f.io.fsyncSync = (fd) => {
    if (published && failAfterRename)
      throw Object.assign(Error("uncertain"), { code: "EIO" });
    sync(fd);
  };
  assert.throws(
    () => store.putBlob(scope, id, bytes),
    (e) => e.persistenceUncertain,
  );
  assert.throws(() => store.putBlob(scope, id, bytes), { code: "EIO" });
  failAfterRename = false;
  assert.equal(store.putBlob(scope, id, bytes).deduplicated, true);
  store.saveWorkspace(scope, 0, {
    "app.ts": { digest: id, size: bytes.length },
  });
  published = false;
  failAfterRename = true;
  assert.throws(
    () => store.snapshot(scope, 1, "submission"),
    (e) => e.persistenceUncertain,
  );
  assert.throws(() => store.snapshot(scope, 1, "submission"), { code: "EIO" });
  failAfterRename = false;
  assert.equal(store.snapshot(scope, 1, "submission").revision, 1);
});
