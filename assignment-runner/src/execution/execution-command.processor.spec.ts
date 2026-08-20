import { Job } from 'bullmq';
import { ExecutionCommand } from '@eevee/execution-contracts';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { WorkerService } from 'src/worker/worker.service';
import { ExecutionCommandProcessor } from './execution-command.processor';
import { ExecutionEventPublisher } from './execution-event.publisher';

describe('ExecutionCommandProcessor', () => {
  it('executes the supplied payload and publishes lifecycle events', async () => {
    const workerService = {
      createWorkerWithInitContainer: jest.fn().mockResolvedValue({
        passes: 3,
        failures: 1,
        completeTrace: 'trace',
      }),
    };
    const executionEventPublisher = {
      publishStarted: jest.fn(),
      publishCompleted: jest.fn(),
      publishFailed: jest.fn(),
    };
    const processor = new ExecutionCommandProcessor(
      workerService as unknown as WorkerService,
      executionEventPublisher as unknown as ExecutionEventPublisher,
    );

    await processor.process({
      data: {
        attemptId: 10,
        userId: 42,
        workerType: WorkerType.NODE_DEFAULT,
        workerData: { files: { 'index.ts': 'console.log(1)' } },
      },
    } as unknown as Job<ExecutionCommand>);

    expect(workerService.createWorkerWithInitContainer).toHaveBeenCalledWith(
      'attempt-10-worker',
      WorkerType.NODE_DEFAULT,
      { files: { 'index.ts': 'console.log(1)' } },
    );
    expect(executionEventPublisher.publishStarted).toHaveBeenCalledWith(10, 42);
    expect(executionEventPublisher.publishCompleted).toHaveBeenCalledWith(10, 42, {
      isAcceptable: true,
      score: 0.75,
      report: 'trace',
      passes: 3,
      fails: 1,
    });
  });
});