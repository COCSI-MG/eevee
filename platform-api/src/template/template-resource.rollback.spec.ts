import { TemplateResourceService } from './template-resource.service';
import { Template } from './entities/template.entity';
import { storeTemplateFile } from 'src/file-storage/template-storage';
jest.mock('src/file-storage/template-storage', () => ({
  ...jest.requireActual('src/file-storage/template-storage'), storeTemplateFile: jest.fn(),
}));
describe('upload transaction boundaries', () => {
  it.each(['save', 'commit'])('uses committed rows after a %s rollback and retry', async (failure) => {
    let committed: any[] = [];
    let fail = true;
    const storage = storeTemplateFile as jest.Mock;
    storage.mockReset().mockImplementation(async (_id, name, _bytes, base) => ({
      id: 'a'.repeat(64), files: { ...base, [name]: { digest: 'b'.repeat(64), size: 1 } },
    }));
    const resources: any = { manager: { transaction: async (fn: any) => {
      let pending = committed;
      const query: any = { setLock: () => query, where: () => query, getOne: async () => ({ id: 42 }) };
      const repo = {
        findOne: async () => null, find: async () => committed, create: (r: any) => r,
        save: async (rows: any[]) => { if (fail && failure === 'save') throw Error('rollback'); return pending = rows; },
      };
      const value = await fn({ query: jest.fn(), getRepository: (entity: any) =>
        entity === Template ? { createQueryBuilder: () => query } : repo });
      if (fail && failure === 'commit') throw Error('rollback');
      committed = pending;
      return value;
    } } };
    const service = new TemplateResourceService(resources, { assertTemplateAccess: jest.fn() } as any);
    const file = (name: string) => ({ originalname: name, size: 1, buffer: Buffer.from('x') } as Express.Multer.File);
    await expect(service.upload(42, file('ghost.csv'))).rejects.toThrow('rollback');
    fail = false;
    await service.upload(42, file('retry.csv'));
    expect(storage.mock.calls[1][3]).toEqual({});
    expect(committed.map((r) => r.fileName)).toEqual(['retry.csv']);
  });

  it('does not touch storage when deletion wins the parent-row lock', async () => {
    const storage = storeTemplateFile as jest.Mock;
    storage.mockClear();
    const query: any = { setLock: () => query, where: () => query, getOne: async () => null };
    const resources: any = { manager: { transaction: async (fn: any) =>
      fn({ query: jest.fn(), getRepository: () => ({ createQueryBuilder: () => query }) }) } };
    const service = new TemplateResourceService(resources, { assertTemplateAccess: jest.fn() } as any);
    await expect(service.upload(42, { originalname: 'x', size: 1, buffer: Buffer.from('x') } as any))
      .rejects.toThrow('Template not found');
    expect(storage).not.toHaveBeenCalled();
  });
});
