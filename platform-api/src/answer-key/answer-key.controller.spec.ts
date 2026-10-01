import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ROLES_KEY } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';
import { AnswerKeyController } from './answer-key.controller';

describe('AnswerKeyController authorization', () => {
  it('uses JWT and role guards for every answer-key route', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AnswerKeyController)).toEqual([
      JwtAuthGuard,
      RolesGuard
    ]);
  });

  it('allows students to read while restricting writes to staff', () => {
    const prototype = AnswerKeyController.prototype;

    expect(Reflect.getMetadata(ROLES_KEY, prototype.findOne)).toEqual([
      UserRole.ADMIN,
      UserRole.TEACHER,
      UserRole.STUDENT
    ]);

    for (const handler of [prototype.create, prototype.update, prototype.remove]) {

      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
        UserRole.ADMIN,
        UserRole.TEACHER
      ]);
    }
  });
});
