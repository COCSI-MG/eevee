// src/worker.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { BullMQModule } from './bullmq/bullmq.module';
import { ConfigModule } from '@nestjs/config';
import { SchedulingModule } from './scheduling/scheduling.module';
import { SchedulingJobProcessor } from './scheduling/scheduling-job.processor';
import { ClsModule } from 'nestjs-cls';
import { KubernetesModule } from './kubernetes/kubernetes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['scheduler-api/.env', '.env'],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    KubernetesModule,
    SchedulingModule,
    DatabaseModule,
    BullMQModule,
  ],
  providers: [SchedulingJobProcessor],
})
export class WorkerModule {}
