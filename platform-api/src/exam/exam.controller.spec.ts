import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ROLES_KEY } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';

describe('ExamController', () => {
  let controller: ExamController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamController],
      providers: [
        {
          provide: ExamService,
          useValue: {}
        }
      ]
    }).compile()

    controller = module.get<ExamController>(ExamController)
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects every endpoint with JWT and role guards', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ExamController)).toEqual([
      JwtAuthGuard,
      RolesGuard
    ]);
  });

  it('declares the allowed roles for every endpoint', () => {
    const expectedRoles = {
      create: [UserRole.ADMIN, UserRole.TEACHER],
      findByClass: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
      findStudents: [UserRole.ADMIN, UserRole.TEACHER],
      findOne: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
      createAssignmentAndLink: [UserRole.ADMIN, UserRole.TEACHER],
      linkAssignment: [UserRole.ADMIN, UserRole.TEACHER],
      unlinkAssignment: [UserRole.ADMIN, UserRole.TEACHER],
      updateAssignmentScore: [UserRole.ADMIN, UserRole.TEACHER],
      update: [UserRole.ADMIN, UserRole.TEACHER],
      remove: [UserRole.ADMIN, UserRole.TEACHER]
    };
    const prototype = ExamController.prototype as unknown as Record<string, Function>

    for (const [handlerName, roles] of Object.entries(expectedRoles)) {
      expect(Reflect.getMetadata(ROLES_KEY, prototype[handlerName])).toEqual(roles)
    }
  });
});
