import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FileSaverService } from './file-saver.service';

type FileSaverJobData = {
  jobId: number;
  localFilePath: string;
  gitRemoteFilePath: string;
};

@Processor('file-saver-queue')
export class FileSaverProcessor extends WorkerHost {
  private readonly logger = new Logger(FileSaverProcessor.name);

  constructor(private readonly fileSaverService: FileSaverService) {
    super();
  }

  async process(job: Job<FileSaverJobData>): Promise<void> {
    this.logger.log(`Processing file saver job id=${job.id}`);
    await this.fileSaverService.uploadFileToGithubRepo(job.data);
  }
}