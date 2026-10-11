import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';
import { WorkerResponse } from 'src/worker/worker.interfaces';
import { TestTemplateDto } from './dto/test-template.dto';
import { TemplateTestService } from './template-test.service';

@Controller('template')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class TemplateTestController {
  constructor(private readonly service: TemplateTestService) {}

  @Post('preview')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async testDraft(@Body() body: TestTemplateDto): Promise<WorkerResponse> {
    return this.service.run(body);
  }
}
