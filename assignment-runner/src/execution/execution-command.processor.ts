import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  EXECUTION_COMMAND_QUEUE,
  ExecutionCommand,
} from '@eevee/execution-contracts';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { WorkerService } from 'src/worker/worker.service';
import { ExecutionEventPublisher } from './execution-event.publisher';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';

@Processor(EXECUTION_COMMAND_QUEUE, { concurrency: 5 })
export class ExecutionCommandProcessor extends WorkerHost {
  private readonly logger = new Logger(ExecutionCommandProcessor.name);

  constructor(
    private readonly workerService: WorkerService,
    private readonly executionEventPublisher: ExecutionEventPublisher,
  ) {
    super();
  }

  async process(job: Job<ExecutionCommand>) {
    const { attemptId, userId, workerData, workerType } = job.data;
    await this.executionEventPublisher.publishStarted(attemptId, userId);

    try {
      const result = await this.workerService.createWorkerWithInitContainer(
        `attempt-${attemptId}-worker`,
        workerType as WorkerType,
        workerData as CreateWorkerDto,
      );
      const score = result.passes / (result.passes + result.failures || 1);

      await this.executionEventPublisher.publishCompleted(attemptId, userId, {
        isAcceptable: score >= 0.7,
        score,
        report: result.completeTrace,
        fails: result.failures,
        passes: result.passes,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown execution error';
      this.logger.error(`Execution failed for attempt ${attemptId}: ${errorMessage}`);
      await this.executionEventPublisher.publishFailed(
        attemptId,
        userId,
        errorMessage,
      );
    }
  }
}