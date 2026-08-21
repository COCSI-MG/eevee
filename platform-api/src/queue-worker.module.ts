import { Module } from '@nestjs/common';
import { AppModule } from './app.module';
import { AttemptModule } from './attempt/attempt.module';
import { FileSaverModule } from './file-saver/file-saver.module';
import { FileSaverConsumer } from './file-saver/file-saver.processor';
import { RealtimeModule } from './realtime/realtime.module';
import { AiReportJobConsumer } from './scheduling/ai-report-job.processor';
import { PreviewJobConsumer } from './scheduling/preview-job.processor';
import { SchedulingModule } from './scheduling/scheduling.module';
import { ExecutionResultConsumer } from './execution/execution-result.consumer';

@Module({
  imports: [
    AppModule,
    SchedulingModule,
    AttemptModule,
    RealtimeModule,
    FileSaverModule,
  ],
  providers: [
    PreviewJobConsumer,
    AiReportJobConsumer,
    ExecutionResultConsumer,
    FileSaverConsumer,
  ],
})
export class QueueWorkerModule {}
