import { InternalServerErrorException } from '@nestjs/common';
import { TemplateResourceService } from './template-resource.service';

describe('TemplateResourceService snapshots', () => {
  const setup = (rows: Array<{ snapshotId?: string | null }>) => {
    const resources = { find: jest.fn().mockResolvedValue(rows) };
    const classAccess = { assertTemplateAccess: jest.fn() };
    return {
      resources,
      classAccess,
      service: new TemplateResourceService(resources as any, classAccess as any),
    };
  };

  it('returns one immutable template grant reference for a coherent resource set', async () => {
    const { service, resources } = setup([
      { snapshotId: 'a'.repeat(64) },
      { snapshotId: 'a'.repeat(64) },
    ]);

    await expect(service.workerSnapshots(42)).resolves.toEqual([
      { scope: 'eevee-template-t42', id: 'a'.repeat(64), kind: 'template' },
    ]);
    expect(resources.find).toHaveBeenCalledWith({ where: { templateId: 42 } });
  });

  it('fails closed instead of silently omitting legacy or partial resources', async () => {
    const legacy = setup([{ snapshotId: null }]).service;
    const partial = setup([{ snapshotId: 'a'.repeat(64) }, { snapshotId: null }]).service;

    await expect(legacy.workerSnapshots(42)).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(partial.workerSnapshots(42)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('enforces template authorization before exposing the resource listing', async () => {
    const { service, resources, classAccess } = setup([]);

    await service.list(7);

    expect(classAccess.assertTemplateAccess).toHaveBeenCalledWith(7, true);
    expect(resources.find).toHaveBeenCalledWith(expect.objectContaining({ where: { templateId: 7 } }));
  });
});
