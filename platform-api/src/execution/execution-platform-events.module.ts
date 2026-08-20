import { Module } from '@nestjs/common';
import { AttemptModule } from 'src/attempt/attempt.module';
import { BullMQModule } from 'src/bullmq/bullmq.module';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { ExecutionResultConsumer } from './execution-result.consumer';

@Module({
  imports: [AttemptModule, BullMQModule, RealtimeModule],
  providers: [ExecutionResultConsumer],
})
export class ExecutionPlatformEventsModule {}