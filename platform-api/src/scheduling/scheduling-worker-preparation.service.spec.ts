import { Assignment } from 'src/assignment/entities/assignment.entity';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { SchedulingWorkerPreparationService } from './scheduling-worker-preparation.service';
import { WorkerPayloadBuilderService } from './worker-payload-builder.service';

describe('SchedulingWorkerPreparationService', () => {
  const service = new SchedulingWorkerPreparationService(
    new WorkerPayloadBuilderService(),
  );

  const buildAssignment = (overrides: Partial<Assignment> = {}) =>
    ({
      id: 7,
      workerType: WorkerType.PYTHON_DEFAULT,
      assignmentTemplates: [
        { template: { id: 1, content: 'def test_ok():\n    pass\n' } },
      ],
      assignmentParams: [],
      ...overrides,
    }) as unknown as Assignment;

  it('keeps the student files when the assignment has no support files', async () => {
    const files = { 'src/app.py': 'def main():\n    pass\n' };

    const workerData = await service.prepare({
      assignment: buildAssignment(),
      baseWorkerData: { files },
    });

    expect(workerData.files).toEqual(files);
  });

  it('adds the support files next to the student files', async () => {
    const workerData = await service.prepare({
      assignment: buildAssignment({
        supportFiles: { 'src/dados.py': 'pedidos = None\n' },
      }),
      baseWorkerData: {
        files: { 'src/app.py': 'from dados import pedidos\n' },
      },
    });

    expect(workerData.files).toEqual({
      'src/app.py': 'from dados import pedidos\n',
      'src/dados.py': 'pedidos = None\n',
    });
  });

  it('overrides a student file that uses the same path as a support file', async () => {
    const workerData = await service.prepare({
      assignment: buildAssignment({
        supportFiles: { 'src/dados.py': 'pedidos = None\n' },
      }),
      baseWorkerData: {
        files: {
          'src/app.py': 'from dados import pedidos\n',
          'src/dados.py': 'pedidos = "alterado"\n',
        },
      },
    });

    expect(workerData.files?.['src/dados.py']).toBe('pedidos = None\n');
  });

  it('sends the support files even when the student sent no files', async () => {
    const workerData = await service.prepare({
      assignment: buildAssignment({
        supportFiles: { 'src/dados.py': 'pedidos = None\n' },
      }),
      baseWorkerData: { files: null },
    });

    expect(workerData.files).toEqual({ 'src/dados.py': 'pedidos = None\n' });
  });
});
