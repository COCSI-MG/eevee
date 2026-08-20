import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateInterviewResponseDto } from './dto/create-interview-response.dto';
import { InterviewResponseService } from './interview-response.service';

@Controller('interview-response')
export class InterviewResponseController {
  constructor(
    private readonly interviewResponseService: InterviewResponseService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  upsert(@Body() body: CreateInterviewResponseDto) {
    return this.interviewResponseService.upsert(body);
  }

  @Get('assignment/:assignmentId/me')
  @UseGuards(JwtAuthGuard)
  findMineByAssignmentId(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    return this.interviewResponseService.findMineByAssignmentId(assignmentId);
  }

  @Get('admin/assignment/:assignmentId')
  @UseGuards(AdminGuard)
  listByAssignmentForAdmin(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    return this.interviewResponseService.listByAssignmentForAdmin(assignmentId);
  }
}
