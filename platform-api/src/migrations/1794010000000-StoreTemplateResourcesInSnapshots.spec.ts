import { StoreTemplateResourcesInSnapshots1794010000000 } from './1794010000000-StoreTemplateResourcesInSnapshots';

describe('StoreTemplateResourcesInSnapshots migration', () => {
  it('keeps legacy paths for backfill but drops their required constraint before new uploads', async () => {
    const query = jest.fn(async (sql: string) =>
      sql.includes('SELECT COUNT') ? [{ count: 0 }] : [],
    );
    await new StoreTemplateResourcesInSnapshots1794010000000().up({ query } as any);

    expect(query.mock.calls.some(([sql]) =>
      sql.includes('ALTER COLUMN "storagePath" DROP NOT NULL'),
    )).toBe(true);
  });
});
