import { Job } from 'bullmq';
import { WorkerService } from 'src/worker/worker.service';
import { ExecutionRequestProcessor } from './execution-request.processor';

describe('ExecutionRequestProcessor', () => {
  const workerService = {
    createWorkerWithInitContainer: jest.fn(),
    cancelWorkerJob: jest.fn(),
  };
  const processor = new ExecutionRequestProcessor(
    workerService as unknown as WorkerService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('executes a worker and returns its raw result to the requester', async () => {
    const result = { passes: 2, failures: 1, completeTrace: 'trace' };
    workerService.createWorkerWithInitContainer.mockResolvedValue(result);

    await expect(
      processor.process({
        data: {
          action: 'execute',
          jobName: 'preview-1-worker',
          workerType: 'node_default',
          workerData: { files: { 'index.ts': 'code' } },
        },
      } as Job),
    ).resolves.toBe(result);
  });

  it('cancels a Kubernetes worker by job name', async () => {
    await processor.process({
      data: { action: 'cancel', jobName: 'preview-1-worker' },
    } as Job);

    expect(workerService.cancelWorkerJob).toHaveBeenCalledWith(
      'preview-1-worker',
    );
  });
});
