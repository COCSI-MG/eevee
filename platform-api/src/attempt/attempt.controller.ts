import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttemptService } from './attempt.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';
import { ListAdminAttemptsQueryDto } from './dto/list-admin-attempts.query.dto';
import { ListAdminUserAttemptsQueryDto } from './dto/list-admin-user-attempts.query.dto';

@Controller('attempt')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttemptController {
  constructor(private readonly attemptService: AttemptService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findAllForAdmin(@Query() query: ListAdminAttemptsQueryDto) {
    return this.attemptService.findAllForAdmin(query);
  }

  @Get('admin/assignment/:assignmentId/user/:userId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
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

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async findOneForAdmin(@Param('id', ParseIntPipe) id: number) {
    const attempt = await this.attemptService.findOneForAdmin(id);
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }
    return attempt;
  }
}
