import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from 'src/user/user-role';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateInterviewResponseDto } from './dto/create-interview-response.dto';
import { InterviewResponseService } from './interview-response.service';

@Controller('interview-response')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterviewResponseController {
  constructor(
    private readonly interviewResponseService: InterviewResponseService,
  ) {}

  @Post()
  upsert(@Body() body: CreateInterviewResponseDto) {
    return this.interviewResponseService.upsert(body);
  }

  @Get('assignment/:assignmentId/me')
  findMineByAssignmentId(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    return this.interviewResponseService.findMineByAssignmentId(assignmentId);
  }

  @Get('admin/assignment/:assignmentId')
  @Roles(UserRole.ADMIN)
  listByAssignmentForAdmin(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    return this.interviewResponseService.listByAssignmentForAdmin(assignmentId);
  }
}
