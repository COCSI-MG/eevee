import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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
}
