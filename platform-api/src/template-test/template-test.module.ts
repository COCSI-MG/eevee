import { Module } from '@nestjs/common';
import { ExecutionModule } from 'src/execution/execution.module';
import { TemplateTestController } from './template-test.controller';
import { TemplateTestService } from './template-test.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  imports: [ExecutionModule],
  controllers: [TemplateTestController],
  providers: [TemplateTestService, JwtAuthGuard, RolesGuard],
})
export class TemplateTestModule {}
