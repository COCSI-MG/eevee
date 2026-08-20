import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CreatePreviewJobMessageDto } from './dto/create-preview-job-message.dto';
import { SchedulingService } from './scheduling.service';

@Processor('preview-queue', { concurrency: 5 })
export class PreviewJobConsumer extends WorkerHost {
  private readonly logger = new Logger(PreviewJobConsumer.name);

  constructor(private readonly schedulingService: SchedulingService) {
    super();
  }

  async process(job: Job<CreatePreviewJobMessageDto>) {
    this.logger.debug(
      `Received preview job id=${job.id} name=${job.name} previewRunId=${job.data?.previewRunId}`,
    );
    await this.schedulingService.processPreviewJob(job.data, (status) =>
      job.updateProgress({
        kind: 'preview',
        id: job.data.previewRunId,
        userId: job.data.userId,
        status,
      }),
    );
  }
}
