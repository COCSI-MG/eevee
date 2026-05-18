import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';

@Processor('ai-report-queue', { concurrency: 10 })
export class AiReportJobConsumer extends WorkerHost {
  private readonly logger = new Logger(AiReportJobConsumer.name);

  constructor(private readonly schedulingService: SchedulingService) {
    super();
  }

  async process(job: Job<{ attemptId: number }>) {
    this.logger.debug(
      `Received AI report job id=${job.id} attemptId=${job.data?.attemptId}`,
    );
    await this.schedulingService.processAiReportJob(job.data.attemptId);
  }
}
