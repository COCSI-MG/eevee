import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConsumerService } from '../../kafka/consumer.service';
import { FileSaverService } from 'src/file-saver/file-saver.service';

@Injectable()
export class RemoteFileSaverConsumer implements OnModuleInit {
  static readonly TOPIC = 'remote-file-saver-events';
  private readonly logger = new Logger();

  constructor(
    private readonly fileSaverService: FileSaverService,
    private readonly consumerService: ConsumerService,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume({
      topic: { topics: ['remote-file-saver-events'] },
      config: { groupId: 'remote-file-saver-consumer' },
      onMessage: async (message) => {
        this.logger.log({
          value: message.value?.toString(),
        });
        const { jobId, fileEntryId, localTempPath, gitRemoteFilePath } =
          JSON.parse(message.value?.toString()!);
        await this.fileSaverService.uploadFileToGithubRepo({
          jobId,
          localFilePath: localTempPath,
          gitRemoteFilePath,
        });
      },
    });
  }
}
