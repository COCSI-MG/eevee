import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

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
        name: 'ai-report-queue',
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
