import { Module } from '@nestjs/common';
import { WorkerModule } from 'src/worker/worker.module';
import { ExecutionCommandProcessor } from './execution-command.processor';
import { ExecutionModule } from './execution.module';

@Module({
  imports: [WorkerModule, ExecutionModule],
  providers: [ExecutionCommandProcessor],
})
export class CodeEvaluatorEngineModule {}