import { Module } from '@nestjs/common';
import { WorkerModule } from 'src/worker/worker.module';
import { ExecutionCommandProcessor } from './execution-command.processor';
import { ExecutionModule } from './execution.module';
import { ExecutionRequestProcessor } from './execution-request.processor';

@Module({
  imports: [WorkerModule, ExecutionModule],
  providers: [ExecutionCommandProcessor, ExecutionRequestProcessor],
})
export class AssignmentRunnerExecutionModule {}
