import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileSaverService } from './file-saver.service';
import { FileSaverController } from './file-saver.controller';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { FileEntry } from './entities/file-saver.entity';
import { SyncJob } from './entities/sync-job.entity';
import { KafkaModule } from 'src/kafka/kafka.module';
import { RemoteFileSaverConsumer } from './consumers/remote-file-saver.consumer';
import { GithubModule } from 'src/github/github.module';

@Module({
  controllers: [FileSaverController],
  imports: [
    TypeOrmModule.forFeature([FileEntry, SyncJob]),
    RequestContextModule,
    KafkaModule,
    GithubModule,
  ],
  providers: [FileSaverService, RemoteFileSaverConsumer],
  exports: [FileSaverService],
})
export class FileSaverModule {}
