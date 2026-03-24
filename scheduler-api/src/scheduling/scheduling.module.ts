import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { WorkerModule } from 'src/worker/worker.module';
import { AttemptModule } from 'src/attempt/attempt.module';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { SchedulerCreateJobPublisher } from './schuduler-create-job.publisher';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  controllers: [SchedulingController],
  providers: [SchedulingService, SchedulerCreateJobPublisher],
  imports: [WorkerModule, AttemptModule, AssignmentModule, KafkaModule],
})
export class SchedulingModule {}
