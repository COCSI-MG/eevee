import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CodeEvaluatorEngineModule } from './execution/execution-orchestrator.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      },
    }),
    CodeEvaluatorEngineModule,
  ],
})
export class CodeEvaluatorEngineAppModule {}