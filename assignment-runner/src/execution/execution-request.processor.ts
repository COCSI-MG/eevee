import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import {
  EXECUTION_REQUEST_QUEUE,
  ExecutionRequestCommand,
  ExecutionWorkerResult,
} from "@eevee/execution-contracts";
import { WorkerType } from "src/worker/enum/worker-type.enum";
import { WorkerService } from "src/worker/worker.service";
import { CreateWorkerDto } from "src/worker/dto/create-worker.dto";

@Processor(EXECUTION_REQUEST_QUEUE, { concurrency: 5 })
export class ExecutionRequestProcessor extends WorkerHost {
  private readonly logger = new Logger(ExecutionRequestProcessor.name);

  constructor(private readonly workerService: WorkerService) {
    super();
  }

  async process(
    job: Job<ExecutionRequestCommand>,
  ): Promise<ExecutionWorkerResult | void> {
    try {
      if (job.data.action === "cancel") {
        await this.workerService.cancelWorkerJob(job.data.jobName);
        return;
      }

      return await this.workerService.createWorkerWithInitContainer(
        job.data.jobName,
        job.data.workerType as WorkerType,
        job.data.workerData as CreateWorkerDto,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown execution error";
      this.logger.error(
        `Request failed for job ${job.data.jobName} (action: ${job.data.action}): ${errorMessage}`,
      );
      throw error;
    }
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job<ExecutionRequestCommand>, error: Error) {
    this.logger.error(
      `Job ${job.id} (${EXECUTION_REQUEST_QUEUE}) failed after ${job.attemptsMade} attempt(s): ${error.message}`,
    );
  }

  @OnWorkerEvent("error")
  onWorkerError(error: Error) {
    this.logger.error(
      `${EXECUTION_REQUEST_QUEUE} worker connection error: ${error.message}`,
    );
  }
}
