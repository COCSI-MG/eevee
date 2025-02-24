import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { WorkerModule } from 'src/worker/worker.module';
import { AttemptModule } from 'src/attempt/attempt.module';
import { AssignmentModule } from 'src/assignment/assignment.module';

@Module({
  controllers: [SchedulingController],
  providers: [SchedulingService],
  imports: [WorkerModule, AttemptModule, AssignmentModule],
})
export class SchedulingModule {}
