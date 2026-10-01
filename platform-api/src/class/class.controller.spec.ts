import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ROLES_KEY } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';

describe('ClassController', () => {
  let controller: ClassController;
  let classService: {
    createOrReplace: jest.Mock;
    findAll: jest.Mock;
    findOptions: jest.Mock;
    findAllByUser: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    restore: jest.Mock;
  };

  beforeEach(async () => {
    classService = {
      createOrReplace: jest.fn(),
      findAll: jest.fn(),
      findOptions: jest.fn(),
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      restore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassController],
      providers: [
        {
          provide: ClassService,
          useValue: classService,
        },
      ],
    }).compile();

    controller = module.get<ClassController>(ClassController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects every endpoint with JWT and role guards', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ClassController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
  });

  it('declares the allowed roles for every endpoint', () => {
    const expectedRoles = {
      create: [UserRole.ADMIN, UserRole.TEACHER],
      findAll: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
      findOptions: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
      findAllByUser: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
      findAllPaginated: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
      findOne: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
      remove: [UserRole.ADMIN, UserRole.TEACHER],
      restore: [UserRole.ADMIN],
      update: [UserRole.ADMIN, UserRole.TEACHER]
    };

    for (const [handlerName, roles] of Object.entries(expectedRoles)) {
      expect(Reflect.getMetadata(ROLES_KEY, ClassController.prototype[handlerName])).toEqual(roles);
    }
  });

  it('delegates create to createOrReplace', async () => {
    const dto = { name: 'Turma 1', students: [1, 2] } as any;
    classService.createOrReplace.mockResolvedValue({ id: 5 });

    await expect(controller.create(dto)).resolves.toEqual({ id: 5 });
    expect(classService.createOrReplace).toHaveBeenCalledWith(dto);
  });

  it('delegates update using the route id', async () => {
    const dto = { name: 'Turma Atualizada' } as any;
    classService.createOrReplace.mockResolvedValue({ id: 9 });

    await expect(controller.update('9', dto)).resolves.toEqual({ id: 9 });
    expect(classService.createOrReplace).toHaveBeenCalledWith({
      ...dto,
      id: 9,
    });
  });

  it('delegates the lightweight options listing', async () => {
    classService.findOptions.mockResolvedValue([{ id: 1, name: 'Turma 1' }]);

    await expect(controller.findOptions()).resolves.toEqual([
      { id: 1, name: 'Turma 1' },
    ]);
    expect(classService.findOptions).toHaveBeenCalledTimes(1);
  });
});
