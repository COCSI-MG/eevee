import { runTemplateResourceBackfill } from './backfill-template-resources';

describe('template resource backfill dry run', () => {
  it('does not issue DDL or writes when legacy snapshot columns are absent', async () => {
    const query = jest.fn(async (sql: string, params?: unknown[]) => {
      if (sql.includes('information_schema.columns')) {
        return [{ exists: params?.[0] === 'storagePath' }];
      }
      if (sql.startsWith('SELECT "id"')) {
        return [{ id: 1, templateId: 7, fileName: 'pedidos.csv', storagePath: 'pedidos.csv' }];
      }
      throw new Error(`Unexpected query: ${sql}`);
    });
    const source = { query, transaction: jest.fn() } as any;

    await expect(runTemplateResourceBackfill({
      source,
      apply: false,
      root: '/never-read',
      read: jest.fn(),
      store: jest.fn(),
      resolvePath: jest.fn(),
    })).resolves.toEqual({
      legacyCount: 1,
      pendingSchema: ['snapshotId', 'digest', 'size'],
      updated: 0,
    });

    expect(query.mock.calls.every(([sql]) => /^\s*SELECT/.test(sql))).toBe(true);
    expect(source.transaction).not.toHaveBeenCalled();
  });

  it('processes only the legacy rows selected by the mixed-state query and is idempotent', async () => {
    const legacyRows = [[{ id: 1, templateId: 7, fileName: 'pedidos.csv', storagePath: 'pedidos.csv' }], []];
    const updated = jest.fn();
    const query = jest.fn(async (sql: string, params?: unknown[]) => {
      if (sql.includes('information_schema.columns')) return [{ exists: true }];
      if (sql.includes('COUNT(*)')) return [{ count: 0 }];
      if (sql.includes('FROM "template_resource"')) return legacyRows.shift();
      throw new Error(`Unexpected query: ${sql}`);
    });
    const source = {
      query,
      transaction: jest.fn(async (callback: any) => callback({ query: updated })),
    } as any;
    const bytes = Buffer.from('orders');
    const store = jest.fn().mockResolvedValue({
      id: 'a'.repeat(64), scope: 'eevee-template-t7', kind: 'template', revision: 1,
      files: { 'pedidos.csv': { digest: 'b'.repeat(64), size: bytes.length } },
    });

    const first = await runTemplateResourceBackfill({
      source, apply: true, root: '/root', read: jest.fn().mockResolvedValue(bytes),
      store, resolvePath: jest.fn().mockResolvedValue('/root/pedidos.csv'),
    });
    const second = await runTemplateResourceBackfill({
      source, apply: true, root: '/root', read: jest.fn(), store,
      resolvePath: jest.fn(),
    });

    expect(first).toEqual({ legacyCount: 1, pendingSchema: [], updated: 1 });
    expect(second).toEqual({ legacyCount: 0, pendingSchema: [], updated: 0 });
    expect(store).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenCalledTimes(1);
    const selection = query.mock.calls.find(([sql]) => sql.includes('ORDER BY "templateId", "id"'))![0];
    expect(selection).toContain('"storagePath" IS NOT NULL');
    expect(selection).toContain('"snapshotId" IS NULL');
  });

  it('refuses partial metadata or a mixed template instead of republishing a current snapshot', async () => {
    const schema = (existingSnapshotCount: number, mixedCount: number, missingDigest = false) => ({
      query: jest.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes('information_schema.columns')) {
          return [{ exists: params?.[0] !== 'digest' || !missingDigest }];
        }
        if (sql.includes('WHERE "snapshotId" IS NOT NULL')) return [{ count: existingSnapshotCount }];
        if (sql.includes('legacy."snapshotId" IS NULL')) return [{ count: mixedCount }];
        throw new Error(`Unexpected query: ${sql}`);
      }),
      transaction: jest.fn(),
    } as any);

    await expect(runTemplateResourceBackfill({
      source: schema(1, 0, true), apply: true, root: '/root',
    })).rejects.toThrow('Snapshot metadata is incomplete');
    await expect(runTemplateResourceBackfill({
      // All columns exist, but an already-issued snapshot has NULL metadata.
      source: schema(1, 0), apply: true, root: '/root',
    })).rejects.toThrow('Snapshot metadata is incomplete');
    await expect(runTemplateResourceBackfill({
      source: schema(0, 1), apply: true, root: '/root',
    })).rejects.toThrow('mixed legacy and immutable snapshots');
  });
});
