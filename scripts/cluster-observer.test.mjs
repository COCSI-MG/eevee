import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { quantity, nextNode, collect, persist } from '../infrastructure/helm/eevee/files/cluster-observer.mjs';
test('quantities and fresh stable evidence, immediate withdrawal and repeated recovery', () => {
  assert.equal(quantity('500m'), .5); assert.equal(quantity('100000000n'), .1);
  assert.equal(quantity('64Mi'), 67108864); assert.equal(quantity(undefined), null);
  const now = Date.now();
  const good = { name: 'node', ready: true, schedulable: true, pressureFree: true, resourcesOk: true, logAccess: true };
  let n = nextNode(good, null, 3, now);
  assert.equal(n.eligible, false);
  n = nextNode(good, n, 3, now + 60000);
  n = nextNode(good, n, 3, now + 120000); assert.equal(n.eligible, true);
  n = nextNode({ ...good, logAccess: false }, n, 3, now + 180000); assert.equal(n.eligible, false);
  n = nextNode(good, n, 3, now + 240000); assert.equal(n.eligible, false);
  assert.equal(nextNode(good, { ...n, successes: 100 }, 3, now + 900000).eligible, false);
});
test('Ready does not certify log access; missing metrics/RBAC remain unknown', async () => {
  const now = Date.now(), timestamp = new Date(now).toISOString();
  const settings = { namespace: 'test', reportConfigMap: 'report', candidateNodes: ['node'],
    endpoints: [{ name: 'good' }, { name: 'bad' }], ttlSeconds: 180, successesRequired: 1, maxNodeMemoryFraction: .9, apiMetricsPort: 9091 };
  const node = { metadata: { name: 'node' }, spec: {}, status: { allocatable: { memory: '1Gi' }, conditions:
    [{ type: 'Ready', status: 'True' }, ...['MemoryPressure', 'DiskPressure', 'PIDPressure'].map(type => ({ type, status: 'False' }))] } };
  const pod = { metadata: { name: 'canary', uid: 'uid', labels: { 'eevee-observer-canary': 'true' } }, spec: { nodeName: 'node', containers: [] },
    status: { phase: 'Running', conditions: [{ type: 'Ready', status: 'True' }] } };
  const get = async (path, endpoint) => {
    if (path.includes('/log?')) { if (endpoint.name === 'bad') throw new Error('HTTP-503'); return `EEVEE_CANARY ${Math.floor(now / 1000)}`; }
    if (path === '/api/v1/nodes') return { items: [node] };
    if (path.includes('/metrics.k8s.io/') && path.endsWith('/nodes')) return { items: [{ metadata: { name: 'node' }, timestamp, usage: { memory: '100Mi', cpu: '10m' } }] };
    if (path.endsWith('/pods')) return { items: path.includes('/metrics.') ? [] : [pod] };
    return { data: {} };
  };
  const report = await collect(settings, get, now);
  assert.equal(report.nodes[0].ready, true); assert.equal(report.nodes[0].eligible, false);
  assert.equal(report.nodes[0].logAccess, false); assert.equal(report.nodes[0].paths[0].ok, true);
  const unknown = await collect(settings, async () => { throw new Error('HTTP-403'); }, now);
  assert.equal(unknown.nodes[0].ready, null); assert.equal(unknown.nodes[0].eligible, false);
  assert(unknown.errors.length > 0);
  const stale = await collect({ ...settings, endpoints: [{ name: 'good' }] }, async (path, ep) => {
    const data = await get(path, ep);
    if (path.includes('/metrics.k8s.io/')) data.items.forEach(item => item.timestamp = new Date(now - 200000).toISOString());
    return data;
  }, now);
  assert.equal(stale.nodes[0].resourcesOk, null); assert.equal(stale.nodes[0].eligible, false);
});
test('reports persist across invocations and retention is bounded', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'eevee-observer-'));
  try {
    for (let n = 0; n < 4; n++) await persist({ timestamp: new Date(100000 + n * 1000).toISOString(), n }, dir, 2);
    assert.equal((await readdir(dir)).filter(n => n.startsWith('sample-')).length, 2);
    assert.equal(JSON.parse(await readFile(join(dir, 'latest.json'))).n, 3);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
