import { Module } from '@nestjs/common';
import { BullMQModule } from 'src/bullmq/bullmq.module';
import { ExecutionEventPublisher } from './execution-event.publisher';

@Module({
  imports: [BullMQModule],
  providers: [ExecutionEventPublisher],
  exports: [ExecutionEventPublisher],
})
export class ExecutionModule {}