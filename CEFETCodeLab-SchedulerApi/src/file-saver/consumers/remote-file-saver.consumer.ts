import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConsumerService } from '../../kafka/consumer.service';
import { FileSaverService } from 'src/file-saver/file-saver.service';
import { REMOTE_FILE_SAVER_TOPIC } from './constants';

@Injectable()
export class RemoteFileSaverConsumer implements OnModuleInit {
  private readonly logger = new Logger();

  constructor(
    private readonly fileSaverService: FileSaverService,
    private readonly consumerService: ConsumerService,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume({
      topic: { topics: [ REMOTE_FILE_SAVER_TOPIC ] },
      config: { groupId: 'remote-file-saver-consumer' },
      onMessage: async (message) => {
        this.logger.log({
          value: message.value?.toString(),
        });
        const { jobId, localTempPath, gitRemoteFilePath } =
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
