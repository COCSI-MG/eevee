"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { DEFAULT_STORAGE_LIMITS, validSnapshotKind } = require("./dist/store.js");

test("template scopes accept only immutable template snapshots and retain the 8 MiB raw budget", () => {
  assert.equal(validSnapshotKind("eevee-template-t42", "template"), true);
  assert.equal(validSnapshotKind("eevee-template-t42", "submission"), false);
  assert.equal(validSnapshotKind("eevee-template-t0", "template"), false);
  assert.equal(DEFAULT_STORAGE_LIMITS.maxFileBytes, 4 * 1024 * 1024);
  assert.equal(DEFAULT_STORAGE_LIMITS.maxProjectBytes, 8 * 1024 * 1024);
});
