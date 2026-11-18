import { createHash } from 'node:crypto';
import { backfillTemplateResourceSnapshots } from './template-resource-backfill';

describe('backfillTemplateResourceSnapshots', () => {
  it('stores each legacy file then attaches all rows to the final immutable snapshot', async () => {
    const pedidos = Buffer.from('id\n1\n');
    const produtos = Buffer.from('sku\na\n');
    const digest = (value: Buffer) => createHash('sha256').update(value).digest('hex');
    const store = jest
      .fn()
      .mockResolvedValueOnce({
        id: 'a'.repeat(64), scope: 'eevee-template-t4', kind: 'template', revision: 1,
        files: { 'pedidos.csv': { digest: digest(pedidos), size: pedidos.length } },
      })
      .mockResolvedValueOnce({
        id: 'b'.repeat(64), scope: 'eevee-template-t4', kind: 'template', revision: 2,
        files: {
          'pedidos.csv': { digest: digest(pedidos), size: pedidos.length },
          'produtos.csv': { digest: digest(produtos), size: produtos.length },
        },
      });
    const read = jest.fn(async (path: string) => path === 'pedidos' ? pedidos : produtos);

    await expect(backfillTemplateResourceSnapshots([
      { id: 1, templateId: 4, fileName: 'pedidos.csv', storagePath: 'pedidos' },
      { id: 2, templateId: 4, fileName: 'produtos.csv', storagePath: 'produtos' },
    ], { read, store })).resolves.toEqual([
      { id: 1, snapshotId: 'b'.repeat(64), digest: digest(pedidos), size: pedidos.length },
      { id: 2, snapshotId: 'b'.repeat(64), digest: digest(produtos), size: produtos.length },
    ]);
    expect(store).toHaveBeenCalledTimes(2);
  });

  it('fails rather than writing metadata for a file omitted by the immutable snapshot', async () => {
    await expect(backfillTemplateResourceSnapshots([
      { id: 1, templateId: 4, fileName: 'pedidos.csv', storagePath: 'pedidos' },
    ], {
      read: jest.fn().mockResolvedValue(Buffer.from('x')),
      store: jest.fn().mockResolvedValue({
        id: 'a'.repeat(64), scope: 'eevee-template-t4', kind: 'template', revision: 1, files: {},
      }),
    })).rejects.toThrow('omitted legacy template resource');
  });
});
