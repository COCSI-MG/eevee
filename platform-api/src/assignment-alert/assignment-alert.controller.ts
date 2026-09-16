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
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AssignmentAlertService } from './assignment-alert.service';
import { CreateAssignmentUserAlertDto } from './dto/create-assignment-user-alert.dto';
import { ListAssignmentAlertUsersDto } from './dto/list-assignment-alert-users.dto';

@Controller('assignment/:assignmentId/alerts')
@UseGuards(JwtAuthGuard)
export class AssignmentAlertController {

  constructor(private readonly assignmentAlertService: AssignmentAlertService) {}

  @Post()
  record(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() dto: CreateAssignmentUserAlertDto,
  ) {
    return this.assignmentAlertService.recordCurrentUserAlert(assignmentId, dto);
  }

  @Get('me/status')
  getMyStatus(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.assignmentAlertService.getCurrentUserStatus(assignmentId);
  }

  @Get('admin/users')
  @UseGuards(AdminGuard)
  listUsers(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Query() query: ListAssignmentAlertUsersDto
  ) {
    return this.assignmentAlertService.listUsers(assignmentId, query);
  }

  @Get('admin/users/:userId')
  @UseGuards(AdminGuard)
  listUserHistory(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: ListAssignmentAlertUsersDto
  ) {
    return this.assignmentAlertService.listUserHistory(assignmentId, userId, query);
  }

  @Post('admin/users/:userId/alerts/:alertId/archive')
  @UseGuards(AdminGuard)
  archiveAlert(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Param('alertId', ParseIntPipe) alertId: number
  ) {
    return this.assignmentAlertService.archiveAlert(assignmentId, userId, alertId);
  }
}
