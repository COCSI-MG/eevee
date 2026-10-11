import { NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { AttemptController } from './attempt.controller';
import { AttemptService } from './attempt.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ROLES_KEY } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';

describe('AttemptController', () => {
  let controller: AttemptController;
  let attemptService: {
    findAllForAdmin: jest.Mock;
    findAllForAdminByAssignmentAndUser: jest.Mock;
    findOneForAdmin: jest.Mock;
  };

  beforeEach(async () => {
    attemptService = {
      findAllForAdmin: jest.fn(),
      findAllForAdminByAssignmentAndUser: jest.fn(),
      findOneForAdmin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttemptController],
      providers: [
        {
          provide: AttemptService,
          useValue: attemptService,
        },
      ],
    }).compile();

    controller = module.get<AttemptController>(AttemptController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('applies authentication and role guards to every attempt route', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AttemptController)).toEqual([
      JwtAuthGuard,
      RolesGuard
    ]);
  });

  it('allows staff on every attempt route', () => {
    const prototype = AttemptController.prototype;

    expect(Reflect.getMetadata(ROLES_KEY, prototype.findAllForAdmin)).toEqual([
      UserRole.ADMIN,
      UserRole.TEACHER
    ]);
    expect(
      Reflect.getMetadata(ROLES_KEY, prototype.findAllForAdminByAssignmentAndUser),
    ).toEqual([UserRole.ADMIN, UserRole.TEACHER]);
    expect(Reflect.getMetadata(ROLES_KEY, prototype.findOneForAdmin)).toEqual([
      UserRole.ADMIN,
      UserRole.TEACHER
    ]);
  });

  it('delegates admin listing to the service', async () => {
    const query = { assignmentId: 99, page: 2 } as any;
    attemptService.findAllForAdmin.mockResolvedValue({ data: [], meta: {} });

    await expect(controller.findAllForAdmin(query)).resolves.toEqual({
      data: [],
      meta: {},
    });
    expect(attemptService.findAllForAdmin).toHaveBeenCalledWith(query);
  });

  it('delegates the assignment and user attempt history to the service', async () => {
    const query = { page: 2, pageSize: 5 };
    const response = { data: [{ id: 12 }], meta: { page: 2 } };
    attemptService.findAllForAdminByAssignmentAndUser.mockResolvedValue(response);

    await expect(
      controller.findAllForAdminByAssignmentAndUser(99, 7, query),
    ).resolves.toEqual(response);

    expect(
      attemptService.findAllForAdminByAssignmentAndUser,
    ).toHaveBeenCalledWith(99, 7, query);
  });

  it('throws NotFoundException when the attempt does not exist', async () => {
    attemptService.findOneForAdmin.mockResolvedValue(null);

    await expect(controller.findOneForAdmin(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
