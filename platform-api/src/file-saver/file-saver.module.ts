import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileSaverService } from './file-saver.service';
import { FileSaverController } from './file-saver.controller';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { FileEntry } from './entities/file-saver.entity';
import { SyncJob } from './entities/sync-job.entity';
import { GithubModule } from 'src/github/github.module';
import { BullMQModule } from 'src/bullmq/bullmq.module';
import { FileSaverConsumer } from './file-saver.processor';

@Module({
  controllers: [FileSaverController],
  imports: [
    TypeOrmModule.forFeature([FileEntry, SyncJob]),
    RequestContextModule,
    GithubModule,
    BullMQModule,
  ],
  providers: [FileSaverService, FileSaverConsumer],
  exports: [FileSaverService],
})
export class FileSaverModule {}
