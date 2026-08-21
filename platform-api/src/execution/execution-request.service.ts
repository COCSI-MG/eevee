import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Job, Queue, QueueEvents } from 'bullmq';
import {
  EXECUTION_REQUEST_QUEUE,
  ExecutionRequestCommand,
  ExecutionWorkerResult,
} from '@eevee/execution-contracts';

@Injectable()
export class ExecutionRequestService implements OnModuleDestroy {
  private readonly events: QueueEvents;

  constructor(
    @InjectQueue(EXECUTION_REQUEST_QUEUE) private readonly queue: Queue,
  ) {
    this.events = new QueueEvents(EXECUTION_REQUEST_QUEUE, {
      connection: this.queue.opts.connection,
    });
  }

  async execute(command: Omit<Extract<ExecutionRequestCommand, { action: 'execute' }>, 'action'>) {
    await this.events.waitUntilReady();
    const job: Job<ExecutionRequestCommand, ExecutionWorkerResult> =
      await this.queue.add('execute-worker', { action: 'execute', ...command }, {
        removeOnComplete: 1000,
        removeOnFail: 1000,
      });
    return job.waitUntilFinished(this.events);
  }

  async cancel(jobName: string): Promise<void> {
    await this.events.waitUntilReady();
    const job = await this.queue.add('cancel-worker', { action: 'cancel', jobName }, {
      removeOnComplete: 1000,
      removeOnFail: 1000,
    });
    await job.waitUntilFinished(this.events);
  }

  async onModuleDestroy() {
    await this.events.close();
  }
}
