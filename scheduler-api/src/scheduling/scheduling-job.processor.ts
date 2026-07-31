import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CreateSchedulingJobMessageDto } from './dto/create-scheduling-job-message.dto';
import { SchedulingService } from './scheduling.service';

@Processor('scheduling-queue', { concurrency: 5 })
export class SchedulingJobConsumer extends WorkerHost {
  private readonly logger = new Logger(SchedulingJobConsumer.name);

  constructor(private readonly schedulingService: SchedulingService) {
    super();
  }

  async process(job: Job<CreateSchedulingJobMessageDto>) {
    this.logger.debug(
      `Received scheduling job id=${job.id} name=${job.name} attemptId=${job.data?.attemptId}`,
    );
    await this.schedulingService.processJobAndWait(job.data, (status) =>
      job.updateProgress({
        kind: 'attempt',
        id: job.data.attemptId,
        userId: job.data.userId,
        status,
      }),
    );
  }
}
