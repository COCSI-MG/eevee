import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { WorkerResponse } from 'src/worker/worker.interfaces';
import { TestTemplateDto } from './dto/test-template.dto';
import { TemplateTestService } from './template-test.service';

@Controller('template')
@UseGuards(AdminGuard)
export class TemplateTestController {
  constructor(private readonly service: TemplateTestService) {}

  @Post('preview')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async testDraft(@Body() body: TestTemplateDto): Promise<WorkerResponse> {
    return this.service.run(body);
  }
}
