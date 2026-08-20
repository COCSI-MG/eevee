import { Module } from '@nestjs/common';
import { WorkerModule } from 'src/worker/worker.module';
import { TemplateTestController } from './template-test.controller';
import { TemplateTestService } from './template-test.service';

@Module({
  imports: [WorkerModule],
  controllers: [TemplateTestController],
  providers: [TemplateTestService],
})
export class TemplateTestModule {}
