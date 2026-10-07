import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { deflateRawSync } from 'zlib';
import { AttemptService } from './attempt.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { ListAdminAttemptsQueryDto } from './dto/list-admin-attempts.query.dto';
import { ListAdminUserAttemptsQueryDto } from './dto/list-admin-user-attempts.query.dto';

@Controller('attempt')
@UseGuards(AdminGuard)
export class AttemptController {
  constructor(private readonly attemptService: AttemptService) {}

  @Get('admin')
  findAllForAdmin(@Query() query: ListAdminAttemptsQueryDto) {
    return this.attemptService.findAllForAdmin(query);
  }

  @Get('admin/assignment/:assignmentId/user/:userId')
  findAllForAdminByAssignmentAndUser(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: ListAdminUserAttemptsQueryDto
  ) {
    return this.attemptService.findAllForAdminByAssignmentAndUser(
      assignmentId,
      userId,
      query
    );
  }

  @Get('admin/assignment/:assignmentId/user/:userId/attempt/:attemptId')
  findSubmittedWorkForAdmin(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('attemptId', ParseIntPipe) attemptId: number,
  ) {
    return this.attemptService.findSubmittedWorkForAdmin(
      assignmentId,
      userId,
      attemptId,
    );
  }

  @Get(':id')
  async findOneForAdmin(@Param('id', ParseIntPipe) id: number) {
    const attempt = await this.attemptService.findOneForAdmin(id);
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }
    return attempt;
  }
}
