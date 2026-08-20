import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EXECUTION_RESULTS_QUEUE } from '@eevee/execution-contracts';
import { AttemptService } from 'src/attempt/attempt.service';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { ExecutionEvent } from './execution-event';

@Processor(EXECUTION_RESULTS_QUEUE)
export class ExecutionResultConsumer extends WorkerHost {
  private readonly logger = new Logger(ExecutionResultConsumer.name);

  constructor(
    private readonly attemptService: AttemptService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {
    super();
  }

  async process(job: Job<ExecutionEvent>) {
    const event = job.data;
    const attempt = await this.attemptService.findOne(event.attemptId);

    if (!attempt || attempt.userId !== event.userId) {
      this.logger.warn(`Ignoring execution event ${event.eventId}`);
      return;
    }

    if (!this.canTransition(attempt.status, event.status)) {
      return;
    }

    switch (event.status) {
      case AttemptStatus.RUNNING:
        await this.attemptService.update({
          id: attempt.id,
          status: AttemptStatus.RUNNING,
        });
        break;
      case AttemptStatus.COMPLETED:
        if (!event.result) {
          this.logger.warn(`Ignoring completed event ${event.eventId} without result`);
          return;
        }
        await this.attemptService.update({
          id: attempt.id,
          status: AttemptStatus.COMPLETED,
          ...event.result,
        });
        break;
      case AttemptStatus.FAILED:
        await this.attemptService.update({
          id: attempt.id,
          status: AttemptStatus.FAILED,
          isAcceptable: false,
          score: 0,
          passes: 0,
          fails: 0,
          report: event.errorMessage ?? 'Execution failed',
        });
        break;
      default:
        this.logger.warn(`Ignoring unsupported execution event ${event.eventId}`);
        return;
    }

    this.realtimeGateway.emitSchedulingEvent({
      kind: 'attempt',
      id: attempt.id,
      userId: attempt.userId,
      status: event.status,
    });
  }

  private canTransition(current: AttemptStatus, next: AttemptStatus) {
    if (next === AttemptStatus.RUNNING) {
      return current === AttemptStatus.PENDING;
    }

    return (
      (next === AttemptStatus.COMPLETED || next === AttemptStatus.FAILED) &&
      (current === AttemptStatus.PENDING || current === AttemptStatus.RUNNING)
    );
  }
}