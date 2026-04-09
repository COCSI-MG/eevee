import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { WorkerModule } from 'src/worker/worker.module';
import { AttemptModule } from 'src/attempt/attempt.module';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { BullMQModule } from 'src/bullmq/bullmq.module';
import { ScorePolicyService } from './score-policy.service';
import { WorkerPayloadBuilderService } from './worker-payload-builder.service';
import { SchedulingAttemptTransitionService } from './scheduling-attempt-transition.service';
import { SchedulingWorkerPreparationService } from './scheduling-worker-preparation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulingPreviewRun } from './entities/scheduling-preview-run.entity';
import { RequestContextModule } from 'src/request-context/request-context.module';

@Module({
  imports: [
    WorkerModule,
    AttemptModule,
    AssignmentModule,
    BullMQModule,
    RequestContextModule,
    TypeOrmModule.forFeature([SchedulingPreviewRun]),
  ],
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    ScorePolicyService,
    WorkerPayloadBuilderService,
    SchedulingWorkerPreparationService,
    SchedulingAttemptTransitionService,
  ],
  exports: [SchedulingService],
})
export class SchedulingModule {}
