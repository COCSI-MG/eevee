import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { AttemptModule } from 'src/attempt/attempt.module';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { BullMQModule } from 'src/bullmq/bullmq.module';
import { ScorePolicyService } from './score-policy.service';
import { WorkerPayloadBuilderService } from './worker-payload-builder.service';
import { SchedulingWorkerPreparationService } from './scheduling-worker-preparation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulingPreviewRun } from './entities/scheduling-preview-run.entity';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { AiReportModule } from 'src/ai-report/ai-report.module';
import { ExecutionModule } from 'src/execution/execution.module';
import { AiReportJobConsumer } from './ai-report-job.processor';
import { AssignmentAlertModule } from 'src/assignment-alert/assignment-alert.module';

@Module({
  imports: [
    AttemptModule,
    AssignmentModule,
    BullMQModule,
    RequestContextModule,
    TypeOrmModule.forFeature([SchedulingPreviewRun]),
    AiReportModule,
    ExecutionModule,
    AssignmentAlertModule
  ],
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    ScorePolicyService,
    WorkerPayloadBuilderService,
    SchedulingWorkerPreparationService,
    AiReportJobConsumer,
  ],
  exports: [SchedulingService],
})
export class SchedulingModule {}
