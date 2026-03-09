import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { WorkerModule } from 'src/worker/worker.module';
import { AttemptModule } from 'src/attempt/attempt.module';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { KafkaModule } from 'src/kafka/kafka.module';
import { SchedulingCreateJobConsumer } from './scheduling-create-job.consumer';
import { AiReportModule } from 'src/ai-report/ai-report.module';

@Module({
  controllers: [SchedulingController],
  providers: [SchedulingService, SchedulingCreateJobConsumer],
  imports: [WorkerModule, AttemptModule, AssignmentModule, KafkaModule, AiReportModule],
})
export class SchedulingModule {}
