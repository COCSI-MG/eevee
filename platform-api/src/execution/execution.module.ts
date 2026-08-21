import { Module } from '@nestjs/common';
import { BullMQModule } from 'src/bullmq/bullmq.module';
import { ExecutionRequestService } from './execution-request.service';

@Module({
  imports: [BullMQModule],
  providers: [ExecutionRequestService],
  exports: [ExecutionRequestService],
})
export class ExecutionModule {}
