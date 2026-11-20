import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CodeEvaluatorEngineModule } from './execution/execution-orchestrator.module';
import { EXECUTION_REQUEST_QUEUE } from '@eevee/execution-contracts';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
        db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0,
      },
    }),
    BullModule.registerQueue({ name: EXECUTION_REQUEST_QUEUE }),
    CodeEvaluatorEngineModule,
  ],
})
export class CodeEvaluatorEngineAppModule {}
