import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileSaverService } from './file-saver.service';
import { FileSaverController } from './file-saver.controller';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { FileEntry } from './entities/file-saver.entity';
import { SyncJob } from './entities/sync-job.entity';
import { GithubModule } from 'src/github/github.module';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  controllers: [FileSaverController],
  imports: [
    TypeOrmModule.forFeature([FileEntry, SyncJob]),
    RequestContextModule,
    GithubModule,
    KafkaModule,
  ],
  providers: [FileSaverService],
  exports: [FileSaverService],
})
export class FileSaverModule {}
