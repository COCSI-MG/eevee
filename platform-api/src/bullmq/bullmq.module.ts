import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  EXECUTION_COMMAND_QUEUE,
  EXECUTION_RESULTS_QUEUE,
} from '@eevee/execution-contracts';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      },
    }),
    BullModule.registerQueue(
      {
        name: 'scheduling-queue',
      },
      {
        name: 'preview-queue',
      },
      {
        name: 'ai-report-queue',
      },
      {
        name: 'file-saver-queue',
      },
      {
        name: EXECUTION_RESULTS_QUEUE,
      },
      {
        name: EXECUTION_COMMAND_QUEUE,
      },
    ),
  ],
  controllers: [],
  exports: [BullModule],
})
export class BullMQModule {}
