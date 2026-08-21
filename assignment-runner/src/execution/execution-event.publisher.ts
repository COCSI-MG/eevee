import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { EXECUTION_RESULTS_QUEUE } from '@eevee/execution-contracts';
import { ExecutionTarget } from '@eevee/execution-contracts';
import { ExecutionEvent, ExecutionEventName } from './execution-event';

@Injectable()
export class ExecutionEventPublisher {
  constructor(
    @InjectQueue(EXECUTION_RESULTS_QUEUE)
    private readonly executionResultsQueue: Queue,
  ) {}

  async publish(params: Omit<ExecutionEvent, 'eventId' | 'occurredAt'>) {
    const event: ExecutionEvent = {
      ...params,
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
    };

    await this.executionResultsQueue.add(event.name, event, {
      jobId: event.eventId,
      removeOnComplete: 1000,
      removeOnFail: 1000,
    });
  }

  publishStarted(target: ExecutionTarget) {
    return this.publish({
      name: 'execution.started.v1',
      target,
      status: 'running',
    });
  }

  publishCompleted(
    target: ExecutionTarget,
    result: NonNullable<ExecutionEvent['result']>,
  ) {
    return this.publish({
      name: 'execution.completed.v1',
      target,
      status: 'completed',
      result,
    });
  }

  publishFailed(target: ExecutionTarget, errorMessage: string) {
    return this.publish({
      name: 'execution.failed.v1',
      target,
      status: 'failed',
      errorMessage,
    });
  }
}
