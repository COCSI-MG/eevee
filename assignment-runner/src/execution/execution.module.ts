import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EXECUTION_RESULTS_QUEUE } from '@eevee/execution-contracts';
import { ExecutionEventPublisher } from './execution-event.publisher';

@Module({
  imports: [BullModule.registerQueue({ name: EXECUTION_RESULTS_QUEUE })],
  providers: [ExecutionEventPublisher],
  exports: [ExecutionEventPublisher],
})
export class ExecutionModule {}