import { TemplateResourceService } from './template-resource.service';
import { Template } from './entities/template.entity';
import { storeTemplateFile } from 'src/file-storage/template-storage';
jest.mock('src/file-storage/template-storage', () => ({
  ...jest.requireActual('src/file-storage/template-storage'), storeTemplateFile: jest.fn(),
}));
const gate = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
};
it('serializes two API replicas through snapshot creation AND DB commit for an empty template', async () => {
  const reached = gate(), commit = gate(), waiting = gate();
  let tail = Promise.resolve(), count = 0;
  let rows: any[] = [];
  const files: any = {};
  const storage = storeTemplateFile as jest.Mock;
  storage.mockImplementation(async (_id, name) => {
    files[name] = { digest: 'a'.repeat(64), size: 1 };
    return { id: String(Object.keys(files).length).repeat(64), files: { ...files } };
  });
  const resources: any = {
    find: async () => rows,
    manager: { transaction: async (callback: any) => {
      const number = ++count;
      let unlock: (() => void) | undefined;
      let pending = rows;
      const repository = {
        findOne: async ({ where }: any) => rows.find((r) => r.fileName === where.fileName),
        find: async () => rows,
        create: (r: any) => r,
        save: async (next: any[]) => (pending = next.map((r, i) => ({ id: i + 1, ...r }))),
      };
      const query: any = {
        setLock: (mode: string) => { expect(mode).toBe('pessimistic_write'); return query; },
        where: (_clause: string, params: any) => { expect(params).toEqual({ templateId: 42 }); return query; },
        getOne: async () => {
          const prior = tail, release = gate();
          tail = release.promise;
          if (number === 2) waiting.resolve();
          await prior;
          unlock = release.resolve;
          return { id: 42 };
        },
      };
      try {
        const result = await callback({ query: jest.fn(), getRepository: (entity: any) =>
          entity === Template ? { createQueryBuilder: () => query } : repository });
        if (number === 1) { reached.resolve(); await commit.promise; }
        rows = pending;
        return result;
      } finally { unlock?.(); }
    } },
  };
  const access: any = { assertTemplateAccess: jest.fn().mockResolvedValue(undefined) };
  const a = new TemplateResourceService(resources, access);
  const b = new TemplateResourceService(resources, access);
  const file = (name: string) => ({ originalname: name, size: 1, buffer: Buffer.from(name) } as Express.Multer.File);
  const first = a.upload(42, file('a'));
  await reached.promise;
  const second = b.upload(42, file('b'));
  await waiting.promise;
  expect(storage).toHaveBeenCalledTimes(1);
  expect(rows).toEqual([]);
  commit.resolve();
  await Promise.all([first, second]);
  expect(storage).toHaveBeenCalledTimes(2);
  expect(rows.map((r) => r.fileName).sort()).toEqual(['a', 'b']);
  expect(new Set(rows.map((r) => r.snapshotId))).toEqual(new Set(['2'.repeat(64)]));
  await expect(a.workerSnapshots(42)).resolves.toEqual([
    { scope: 'eevee-template-t42', id: '2'.repeat(64), kind: 'template' },
  ]);
});
