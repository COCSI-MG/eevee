import { eligibleNodeAffinity, NodeReportUnavailableError } from './node-eligibility';
const now = Date.now();
const stable = (name: string) => ({ name, eligible: true, ready: true, schedulable: true, logAccess: true,
  labels: { pool: 'workers' } });
const report = (overrides = {}) => JSON.stringify({ schemaVersion: 1, namespace: 'test',
  timestamp: new Date(now - 1000).toISOString(), expiresAt: new Date(now + 180000).toISOString(),
  nodes: [stable('node-a'), stable('node-b'), { ...stable('node-c'), eligible: false }], ...overrides });
describe('node admission policy', () => {
  it('prefers all stable compatible nodes without excluding other nodes', () => {
    const affinity = eligibleNodeAffinity(report(), 'test', { pool: 'workers' }, 180, now);
    expect(affinity!.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[0].preference.matchFields[0])
      .toEqual({ key: 'metadata.name', operator: 'In', values: ['node-a', 'node-b'] });
    expect((affinity!.nodeAffinity as any).requiredDuringSchedulingIgnoredDuringExecution).toBeUndefined();
  });
  it.each([
    '{}', 'not-json', report({ namespace: 'other' }),
    report({ timestamp: new Date(now - 181000).toISOString() }),
    report({ timestamp: new Date(now + 6000).toISOString() }),
    report({ expiresAt: new Date(now - 1).toISOString() }),
  ])('rejects missing/stale/incompatible or unsuccessful evidence', raw => {
    expect(() => eligibleNodeAffinity(raw, 'test', null, 180, now)).toThrow(NodeReportUnavailableError);
  });
  it('does not bypass the existing worker selector', () => {
    expect(eligibleNodeAffinity(report(), 'test', { pool: 'another' }, 180, now)).toBeUndefined();
  });
  it('falls back when every node is untrusted or log access is unsuccessful', () => {
    expect(eligibleNodeAffinity(report({ nodes: [] }), 'test', null, 180, now)).toBeUndefined();
    expect(eligibleNodeAffinity(report({ nodes: [{ ...stable('node-a'), logAccess: false }] }), 'test', null, 180, now)).toBeUndefined();
  });
});
