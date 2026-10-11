import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ROLES_KEY } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';
import { AssignmentAlertController } from './assignment-alert.controller';

describe('AssignmentAlertController authorization', () => {
  it('uses JWT and role guards for every assignment-alert route', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AssignmentAlertController)).toEqual([
      JwtAuthGuard,
      RolesGuard
    ])
  })

  it.each([
    {
      route: 'POST /assignment/:assignmentId/alerts',
      handler: AssignmentAlertController.prototype.record,
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]
    },
    {
      route: 'GET /assignment/:assignmentId/alerts/me/status',
      handler: AssignmentAlertController.prototype.getMyStatus,
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]
    },
    {
      route: 'GET /assignment/:assignmentId/alerts/admin/users',
      handler: AssignmentAlertController.prototype.listUsers,
      roles: [UserRole.ADMIN, UserRole.TEACHER]
    },
    {
      route: 'GET /assignment/:assignmentId/alerts/admin/users/:userId',
      handler: AssignmentAlertController.prototype.listUserHistory,
      roles: [UserRole.ADMIN, UserRole.TEACHER]
    },
    {
      route: 'POST /assignment/:assignmentId/alerts/admin/users/:userId/alerts/:alertId/archive',
      handler: AssignmentAlertController.prototype.archiveAlert,
      roles: [UserRole.ADMIN, UserRole.TEACHER]
    },
  ])('$route allows only the declared roles', ({ handler, roles }) => {
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(roles)
  })
});
