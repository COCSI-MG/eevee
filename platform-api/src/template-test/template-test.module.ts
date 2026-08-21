import { Module } from '@nestjs/common';
import { ExecutionModule } from 'src/execution/execution.module';
import { TemplateTestController } from './template-test.controller';
import { TemplateTestService } from './template-test.service';

@Module({
  imports: [ExecutionModule],
  controllers: [TemplateTestController],
  providers: [TemplateTestService],
})
export class TemplateTestModule {}
