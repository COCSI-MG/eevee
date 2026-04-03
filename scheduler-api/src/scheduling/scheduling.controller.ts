import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { SCHEDULER_CREATE_JOB } from './constants';
import { CreateSchedulingJobMessageDto } from './dto/create-scheduling-job-message.dto';

@Controller('scheduling')
@UseGuards(JwtAuthGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post()
  async create(
    @Body()
    createSchedulingDto: CreateSchedulingDto,
  ) {
    return await this.schedulingService.createAndWait(createSchedulingDto);
  }

  @Post('wait')
  async createAndWait(
    @Body()
    createSchedulingDto: CreateSchedulingDto,
  ) {
    return await this.schedulingService.createAndWait(createSchedulingDto);
  }

  @Post('await')
  async createAsync(
    @Body()
    createSchedulingDto: CreateSchedulingDto,
  ) {
    return await this.schedulingService.createSchedulingJobAsync(
      createSchedulingDto,
    );
  }

  @Post('retry/:attemptId')
  @UseGuards(AdminGuard)
  async retryAttempt(@Param('attemptId', ParseIntPipe) attemptId: number) {
    return await this.schedulingService.retryAttemptFromAdmin(attemptId);
  }

  @EventPattern(SCHEDULER_CREATE_JOB)
  async handleCreateSchedulingJob(
    @Payload() message: CreateSchedulingJobMessageDto,
  ) {
    return this.schedulingService.ProcessJobAndWait(message);
  }
}
