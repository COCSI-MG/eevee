import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  EXECUTION_REQUEST_QUEUE,
  ExecutionRequestCommand,
  ExecutionWorkerResult,
} from '@eevee/execution-contracts';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { WorkerService } from 'src/worker/worker.service';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';

@Processor(EXECUTION_REQUEST_QUEUE, { concurrency: 5 })
export class ExecutionRequestProcessor extends WorkerHost {
  constructor(private readonly workerService: WorkerService) {
    super();
  }

  async process(
    job: Job<ExecutionRequestCommand>,
  ): Promise<ExecutionWorkerResult | void> {
    if (job.data.action === 'cancel') {
      await this.workerService.cancelWorkerJob(job.data.jobName);
      return;
    }

    return this.workerService.createWorkerWithInitContainer(
      job.data.jobName,
      job.data.workerType as WorkerType,
      job.data.workerData as CreateWorkerDto,
    );
  }
}
