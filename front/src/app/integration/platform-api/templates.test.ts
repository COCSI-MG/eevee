import { TemplatesService } from './templates';
import { WorkerType } from '@/app/interface/platform-api/worker';
import type { CreateTemplateRequest, Template } from '@/app/interface/platform-api/template';

afterEach(() => jest.restoreAllMocks());

it('retries failed resource uploads on the template that was already created', async () => {
  const request: CreateTemplateRequest = {
    classId: 1, title: 'Example', description: 'Example',
    workerType: WorkerType.PYTHON_DEFAULT, content: 'test', params: [],
  };
  const template = { id: 42 } as Template;
  const create = jest.spyOn(TemplatesService, 'create').mockResolvedValue(template);
  const update = jest.spyOn(TemplatesService, 'update').mockResolvedValue(template);
  const upload = jest.spyOn(TemplatesService, 'uploadResource')
    .mockRejectedValueOnce(new Error('unavailable'))
    .mockResolvedValueOnce({ id: 1, fileName: 'data.csv' });
  const file = new File(['data'], 'data.csv');
  let createdId: number | undefined;

  await expect(TemplatesService.saveWithResources(request, [file], (id) => {
    createdId = id;
  })).rejects.toThrow('O template foi salvo');
  expect(createdId).toBe(42);

  await TemplatesService.saveWithResources(
    { ...request, id: createdId }, [file], (id) => { createdId = id; },
  );
  expect(create).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenCalledWith(42, expect.objectContaining({ id: 42 }));
  expect(upload).toHaveBeenCalledTimes(2);
  expect(upload).toHaveBeenLastCalledWith(42, file);
});
