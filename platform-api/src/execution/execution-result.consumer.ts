import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EXECUTION_RESULTS_QUEUE } from '@eevee/execution-contracts';
import { AttemptService } from 'src/attempt/attempt.service';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { ExecutionEvent } from './execution-event';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SchedulingPreviewRun,
  SchedulingPreviewRunStatus,
} from 'src/scheduling/entities/scheduling-preview-run.entity';

@Processor(EXECUTION_RESULTS_QUEUE)
export class ExecutionResultConsumer extends WorkerHost {
  private readonly logger = new Logger(ExecutionResultConsumer.name);

  constructor(
    private readonly attemptService: AttemptService,
    private readonly realtimeGateway: RealtimeGateway,
    @InjectRepository(SchedulingPreviewRun)
    private readonly previewRepository: Repository<SchedulingPreviewRun>,
  ) {
    super();
  }

  async process(job: Job<ExecutionEvent>) {
    const event = job.data;
    if (event.target.kind === 'preview') {
      await this.processPreview(event);
      return;
    }

    const attempt = await this.attemptService.findOne(event.target.id);

    if (!attempt || attempt.userId !== event.target.userId) {
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

  private async processPreview(event: ExecutionEvent) {
    const preview = await this.previewRepository.findOne({
      where: { id: event.target.id },
    });
    if (!preview || preview.userId !== event.target.userId) {
      this.logger.warn(`Ignoring execution event ${event.eventId}`);
      return;
    }
    if (!this.canTransitionPreview(preview.status, event.status)) return;

    if (event.status === 'running') {
      await this.previewRepository.update(preview.id, {
        status: SchedulingPreviewRunStatus.RUNNING,
      });
    } else if (event.status === 'completed' && event.result) {
      await this.previewRepository.update(preview.id, {
        status: SchedulingPreviewRunStatus.COMPLETED,
        ...event.result,
        completedAt: new Date(),
      });
    } else if (event.status === 'failed') {
      await this.previewRepository.update(preview.id, {
        status: SchedulingPreviewRunStatus.FAILED,
        errorMessage: event.errorMessage ?? 'Execution failed',
        completedAt: new Date(),
      });
    } else {
      return;
    }

    this.realtimeGateway.emitSchedulingEvent({
      kind: 'preview',
      id: preview.id,
      userId: preview.userId,
      status: event.status,
    });
  }

  private canTransition(
    current: AttemptStatus,
    next: ExecutionEvent['status'],
  ) {
    if (next === 'running') {
      return current === AttemptStatus.PENDING;
    }

    return (
      (next === 'completed' || next === 'failed') &&
      (current === AttemptStatus.PENDING || current === AttemptStatus.RUNNING)
    );
  }

  private canTransitionPreview(
    current: SchedulingPreviewRunStatus,
    next: ExecutionEvent['status'],
  ) {
    if (next === 'running') {
      return current === SchedulingPreviewRunStatus.PENDING;
    }
    return (
      (next === 'completed' || next === 'failed') &&
      (current === SchedulingPreviewRunStatus.PENDING ||
        current === SchedulingPreviewRunStatus.RUNNING)
    );
  }
}
