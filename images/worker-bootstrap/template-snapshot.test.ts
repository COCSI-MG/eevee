import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  MAX_TEMPLATE_BUNDLE_BYTES,
  mergeTemplateSnapshotFiles,
  readTemplateSnapshot,
} from './template-snapshot.js';

test('deduplicates the same name only when the bytes are identical', () => {
  const target: Record<string, Buffer> = { 'pedidos.csv': Buffer.from('id,value\n1,2\n') };

  mergeTemplateSnapshotFiles(
    target,
    { 'pedidos.csv': Buffer.from('id,value\n1,2\n') },
    {},
    '/app/test',
  );

  assert.equal(target['pedidos.csv'].toString(), 'id,value\n1,2\n');
  assert.throws(
    () => mergeTemplateSnapshotFiles(target, { 'pedidos.csv': Buffer.from('other') }, {}, '/app/test'),
    /Template resource path collision/,
  );
});

test('keeps test paths protected and admits the full base64 transfer budget', () => {
  assert.throws(
    () => mergeTemplateSnapshotFiles({}, { 'pedidos.csv': Buffer.from('x') }, { 'pedidos.csv': 'test' }, '/app/test'),
    /Template resource path collision/,
  );
  assert.equal(MAX_TEMPLATE_BUNDLE_BYTES, 12 * 1024 * 1024);
});

test('protects normalized test destinations and rejects traversal', () => {
  assert.throws(
    () => mergeTemplateSnapshotFiles(
      {},
      { 'pedidos.csv': Buffer.from('fixture') },
      { 'test/pedidos.csv': 'test body' },
      '/app/test',
    ),
    /Template resource path collision/,
  );
  assert.throws(
    () => mergeTemplateSnapshotFiles(
      {},
      { 'pedidos.csv': Buffer.from('fixture') },
      { '../pedidos.csv': 'test body' },
      '/app/test',
    ),
    /Unsafe worker file path/,
  );
  assert.throws(
    () => mergeTemplateSnapshotFiles(
      {},
      { 'test/test/pedidos.csv': Buffer.from('fixture') },
      {},
      '/app/test',
    ),
    /Nested template resource path is not supported/,
  );
});

test('parses and verifies a valid 8 MiB raw fixture after base64 JSON framing', async () => {
  const bytes = Buffer.alloc(8 * 1024 * 1024, 'p');
  const digest = createHash('sha256').update(bytes).digest('hex');
  const canonical = {
    version: 1 as const,
    scope: 'eevee-template-t1',
    revision: 1,
    kind: 'template' as const,
    files: { 'pedidos.csv': { digest, size: bytes.length } },
  };
  const id = createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
  const payload = JSON.stringify({
    manifest: { id, ...canonical },
    files: { 'pedidos.csv': bytes.toString('base64') },
  });
  assert.ok(Buffer.byteLength(payload) > 8 * 1024 * 1024);
  assert.ok(Buffer.byteLength(payload) <= MAX_TEMPLATE_BUNDLE_BYTES);

  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(payload, {
    headers: { 'content-length': String(Buffer.byteLength(payload)) },
  })) as typeof fetch;
  try {
    const files = await readTemplateSnapshot({
      scope: canonical.scope,
      id,
      kind: 'template',
      url: 'http://source-storage:3020',
      token: 'test',
    });
    assert.deepEqual(files['pedidos.csv'], bytes);
  } finally {
    globalThis.fetch = realFetch;
  }
});
