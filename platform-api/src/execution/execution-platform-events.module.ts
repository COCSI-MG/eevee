import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttemptModule } from 'src/attempt/attempt.module';
import { BullMQModule } from 'src/bullmq/bullmq.module';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { SchedulingPreviewRun } from 'src/scheduling/entities/scheduling-preview-run.entity';
import { ExecutionResultConsumer } from './execution-result.consumer';

@Module({
  imports: [
    AttemptModule,
    BullMQModule,
    RealtimeModule,
    TypeOrmModule.forFeature([SchedulingPreviewRun]),
  ],
  providers: [ExecutionResultConsumer],
})
export class ExecutionPlatformEventsModule {}
