import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { Roles } from 'src/auth/roles.decorator'
import { UserRole } from 'src/user/user-role'
import { AssignmentAlertService } from './assignment-alert.service';
import { CreateAssignmentUserAlertDto } from './dto/create-assignment-user-alert.dto';
import { ListAssignmentAlertUsersDto } from './dto/list-assignment-alert-users.dto';

@Controller('assignment/:assignmentId/alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentAlertController {

  constructor(private readonly assignmentAlertService: AssignmentAlertService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  record(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() dto: CreateAssignmentUserAlertDto,
  ) {
    return this.assignmentAlertService.recordCurrentUserAlert(assignmentId, dto);
  }

  @Get('me/status')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  getMyStatus(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.assignmentAlertService.getCurrentUserStatus(assignmentId);
  }

  @Get('admin/users')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  listUsers(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Query() query: ListAssignmentAlertUsersDto
  ) {
    return this.assignmentAlertService.listUsers(assignmentId, query);
  }

  @Get('admin/users/:userId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  listUserHistory(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: ListAssignmentAlertUsersDto
  ) {
    return this.assignmentAlertService.listUserHistory(assignmentId, userId, query);
  }

  @Post('admin/users/:userId/alerts/:alertId/archive')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  archiveAlert(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('alertId', ParseIntPipe) alertId: number
  ) {
    return this.assignmentAlertService.archiveAlert(assignmentId, userId, alertId);
  }
}
