import { Controller, Get, Header, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AssignmentAlertService } from 'src/assignment-alert/assignment-alert.service';
import { ClassAccessService } from 'src/auth/class-access.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { createStorageGrant, type StorageDraft } from 'src/file-storage/source-storage';
import { RequestContextService } from 'src/request-context/request-context.service';
import { UserRole } from 'src/user/user-role';

@Controller('assignment-storage/:assignmentId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentStorageController {
  constructor(
    private readonly classAccess: ClassAccessService,
    private readonly assignmentAlertService: AssignmentAlertService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Get('workspace/grant')
  @Header('Cache-Control', 'no-store')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  getWorkspaceStorageGrant(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.issueGrant(assignmentId, 'workspace');
  }

  @Get('answer-key/grant')
  @Header('Cache-Control', 'no-store')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  getAnswerKeyStorageGrant(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.issueGrant(assignmentId, 'answer-key');
  }

  private async issueGrant(assignmentId: number, draft: StorageDraft) {
    await this.classAccess.assertAssignmentAccess(assignmentId, draft === 'answer-key');
    await this.assignmentAlertService.assertCurrentUserNotSuspended(assignmentId);
    return createStorageGrant(this.requestContextService.getUser().userId, assignmentId, draft);
  }
}
