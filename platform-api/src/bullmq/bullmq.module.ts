import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  EXECUTION_COMMAND_QUEUE,
  EXECUTION_RESULTS_QUEUE,
  EXECUTION_REQUEST_QUEUE,
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
        name: 'ai-report-queue',
      },
      {
        name: 'file-saver-queue',
      },
      {
        name: 'session-cleanup-queue',
      },
      {
        name: EXECUTION_RESULTS_QUEUE,
      },
      {
        name: EXECUTION_COMMAND_QUEUE,
      },
      {
        name: EXECUTION_REQUEST_QUEUE,
      },
    ),
  ],
  controllers: [],
  exports: [BullModule],
})
export class BullMQModule {}
