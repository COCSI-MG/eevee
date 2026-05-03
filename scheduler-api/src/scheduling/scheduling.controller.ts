import {
  Body,
  Delete,
  Get,
  Controller,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('scheduling')
@UseGuards(JwtAuthGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async create(
    @Body()
    createSchedulingDto: CreateSchedulingDto,
  ) {
    return await this.schedulingService.createAndWait(createSchedulingDto);
  }

  @Post('wait')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async createAndWait(
    @Body()
    createSchedulingDto: CreateSchedulingDto,
  ) {
    return await this.schedulingService.createAndWait(createSchedulingDto);
  }

  @Post('await')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async createAsync(
    @Body()
    createSchedulingDto: CreateSchedulingDto,
  ) {
    return await this.schedulingService.createSchedulingJobAsync(
      createSchedulingDto,
    );
  }

  @Post('preview')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async createPreview(
    @Body()
    createSchedulingDto: CreateSchedulingDto,
  ) {
    return await this.schedulingService.createPreviewRun(createSchedulingDto);
  }

  @Get('preview/:previewRunId')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  async getPreviewRun(
    @Param('previewRunId', ParseIntPipe) previewRunId: number,
  ) {
    const previewRun =
      await this.schedulingService.getPreviewRunForCurrentUser(previewRunId);

    if (!previewRun) {
      throw new NotFoundException('Preview run not found');
    }

    return previewRun;
  }

  @Delete('preview/:previewRunId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async cancelPreviewRun(
    @Param('previewRunId', ParseIntPipe) previewRunId: number,
  ) {
    return await this.schedulingService.cancelPreviewRun(previewRunId);
  }

  @Post('retry/:attemptId')
  @UseGuards(AdminGuard)
  async retryAttempt(@Param('attemptId', ParseIntPipe) attemptId: number) {
    return await this.schedulingService.retryAttemptFromAdmin(attemptId);
  }

  @Post('attempt/:id/feedback')
  async requestFeedback(@Param('id', ParseIntPipe) id: number) {
    await this.schedulingService.requestAiFeedback(id);
    return { status: 'ok' };
  }

  @Get('attempt/:id/feedback')
  async getFeedback(@Param('id', ParseIntPipe) id: number) {
    const refinedReport = await this.schedulingService.getAiFeedback(id);
    return { refinedReport };
  }
}
