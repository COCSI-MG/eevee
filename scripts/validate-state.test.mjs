import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clusterChecks, main, syncIssues } from './validate-state.mjs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';

test('detects service availability faults and records failed jobs without attributing infrastructure blame', () => {
  const checks = clusterChecks({ items: [{ metadata: { name: 'platform-api-deployment', generation: 2 }, spec: { replicas: 1 }, status: { availableReplicas: 1, updatedReplicas: 1, observedGeneration: 1 } }] }, { items: [{ metadata: {}, status: { phase: 'Running', conditions: [{ type: 'Ready', status: 'False' }] } }] }, { items: [{ status: { conditions: [{ type: 'Failed', status: 'True' }] } }] });
  assert.ok(checks.filter(c => !['container-crashes', 'worker-jobs'].includes(c.id)).every(c => !c.ok));
  assert.equal(checks.find(c => c.id === 'worker-jobs').ok, null);
});

test('a failed or initializing worker does not mark service pods unhealthy', () => {
  const checks = clusterChecks({ items: [] }, { items: [
    { metadata: { ownerReferences: [{ kind: 'Job' }] }, status: { phase: 'Failed', containerStatuses: [{ name: 'worker', restartCount: 1, lastState: { terminated: { exitCode: 137, finishedAt: new Date().toISOString() } } }] } },
    { metadata: { labels: { 'batch.kubernetes.io/job-name': 'preview' } }, status: { phase: 'Pending' } },
  ] }, { items: [] });
  assert.equal(checks.find(c => c.id === 'pods').ok, true);
  assert.equal(checks.find(c => c.id === 'container-crashes').ok, true);
});

test('GitHub incidents reopen and recover; unknown evidence does not resolve an incident', async () => {
  const previousFetch = globalThis.fetch;
  const previous = { ...process.env };
  const marker = '<!-- eevee-state:test:api -->';
  let issue = { number: 7, state: 'closed', body: marker };
  const writes = [];
  globalThis.fetch = async (url, options) => {
    if (options.method === 'GET') return new Response(JSON.stringify([issue]), { status: 200 });
    const body = JSON.parse(options.body);
    writes.push({ method: options.method, body });
    if (options.method === 'PATCH') issue = { ...issue, ...body };
    return new Response(JSON.stringify({}), { status: 200 });
  };
  try {
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_REPOSITORY = 'example/eevee';
    const report = ok => ({ environment: 'test', timestamp: '2026-10-12T00:00:00Z', checks: [{ id: 'api', ok, detail: 'test evidence' }] });
    await syncIssues(report(false));
    assert.equal(issue.state, 'open');
    assert.equal(writes.length, 2);
    await syncIssues(report(false));
    await syncIssues(report(null));
    assert.equal(writes.length, 2);
    await syncIssues(report(true));
    assert.equal(issue.state, 'closed');
    assert.equal(writes.length, 4);
  } finally {
    globalThis.fetch = previousFetch;
    process.env = previous;
  }
});

test('detects a recent crash even when the container is currently ready', () => {
  const checks = clusterChecks({ items: [] }, { items: [{ metadata: { name: 'api' }, status: { phase: 'Running', conditions: [{ type: 'Ready', status: 'True' }], containerStatuses: [{ name: 'api', restartCount: 16, lastState: { terminated: { exitCode: 139, finishedAt: new Date().toISOString() } } }] } }] }, { items: [] });
  assert.equal(checks.find(c => c.id === 'container-crashes').ok, false);
  assert.equal(checks.find(c => c.id === 'pods').ok, true);
});

test('HTTP failure and recovery append a persistent history', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'eevee-state-'));
  let status = 503;
  const server = createServer((req, res) => { res.writeHead(status); res.end('All systems online!'); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const previous = { ...process.env };
  try {
    process.env.EEVEE_API_URL = `http://127.0.0.1:${server.address().port}`;
    process.env.EEVEE_HISTORY_DIR = dir;
    delete process.env.EEVEE_FRONT_URL;
    delete process.env.EEVEE_KUBERNETES;
    assert.equal(await main(), 1);
    status = 200;
    assert.equal(await main(), 0);
    const reports = (await readFile(join(dir, 'history.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
    assert.deepEqual(reports.map(r => r.ok), [false, true]);
  } finally {
    process.env = previous;
    await new Promise(resolve => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
