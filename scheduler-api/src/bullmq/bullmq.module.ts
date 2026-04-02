import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SchedulingModule } from 'src/scheduling/scheduling.module'
import { FileSaverModule } from 'src/file-saver/file-saver.module';
import { SchedulingJobProcessor } from 'src/scheduling/scheduling-job.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue(
      {
        name: 'scheduling-queue',
      },
      {
        name: 'file-saver-queue',
      },
    ),
  ],
  controllers: [],
  exports: [BullModule],
})
export class BullMQModule {}
