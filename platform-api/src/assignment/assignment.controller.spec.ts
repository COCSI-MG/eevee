import { Test, TestingModule } from '@nestjs/testing';
import { RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ROLES_KEY } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';

describe('AssignmentController', () => {
  let controller: AssignmentController;
  let assignmentService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOptions: jest.Mock;
    findAssignmentsByClass: jest.Mock;
    findAllUserAssignments: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    findImportSources: jest.Mock;
    findImportSource: jest.Mock;
  };

  beforeEach(async () => {
    assignmentService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOptions: jest.fn(),
      findAssignmentsByClass: jest.fn(),
      findAllUserAssignments: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findImportSources: jest.fn(),
      findImportSource: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentController],
      providers: [
        {
          provide: AssignmentService,
          useValue: assignmentService,
        },
      ],
    }).compile();

    controller = module.get<AssignmentController>(AssignmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('applies authentication and role guards to every assignment route', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AssignmentController)).toEqual([
      JwtAuthGuard,
      RolesGuard
    ]);
  });

  it.each([
    {
      route: 'POST /assignment',
      handler: AssignmentController.prototype.create,
      method: RequestMethod.POST,
      path: '/',
      roles: [UserRole.ADMIN, UserRole.TEACHER]
    },
    {
      route: 'GET /assignment',
      handler: AssignmentController.prototype.findAll,
      method: RequestMethod.GET,
      path: '/',
      roles: [UserRole.ADMIN]
    },
    {
      route: 'GET /assignment/options',
      handler: AssignmentController.prototype.findOptions,
      method: RequestMethod.GET,
      path: 'options',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]
    },
    {
      route: 'GET /assignment/class/:classId',
      handler: AssignmentController.prototype.findAssignmentsByClass,
      method: RequestMethod.GET,
      path: 'class/:classId',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]
    },
    {
      route: 'GET /assignment/me',
      handler: AssignmentController.prototype.findAllMyAssignments,
      method: RequestMethod.GET,
      path: 'me',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]
    },
    {
      route: 'GET /assignment/paginated',
      handler: AssignmentController.prototype.findAllPaginated,
      method: RequestMethod.GET,
      path: 'paginated',
      roles: [UserRole.ADMIN, UserRole.TEACHER]
    },
    {
      route: 'GET /assignment/:id/import-sources',
      handler: AssignmentController.prototype.findImportSources,
      method: RequestMethod.GET,
      path: ':id/import-sources',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]
    },
    {
      route: 'GET /assignment/:id/import-sources/:sourceId',
      handler: AssignmentController.prototype.findImportSource,
      method: RequestMethod.GET,
      path: ':id/import-sources/:sourceId',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]
    },
    {
      route: 'GET /assignment/:id',
      handler: AssignmentController.prototype.findOne,
      method: RequestMethod.GET,
      path: ':id',
      roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]
    },
    {
      route: 'PATCH /assignment/:id',
      handler: AssignmentController.prototype.update,
      method: RequestMethod.PATCH,
      path: ':id',
      roles: [UserRole.ADMIN, UserRole.TEACHER]
    },
    {
      route: 'DELETE /assignment/:id',
      handler: AssignmentController.prototype.remove,
      method: RequestMethod.DELETE,
      path: ':id',
      roles: [UserRole.ADMIN, UserRole.TEACHER]
    }

  ])('$route allows only the declared roles', ({ handler, method, path, roles }) => {
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(method);
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(path);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(roles);
  });

  it('delegates create to the service', async () => {
    const dto = { title: 'Assignment' } as any;
    assignmentService.create.mockResolvedValue({ id: 10 });

    await expect(controller.create(dto)).resolves.toEqual({ id: 10 });
    expect(assignmentService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update with a numeric id', async () => {
    const dto = { title: 'Updated Assignment' } as any;
    assignmentService.update.mockResolvedValue({ id: 4 });

    await expect(controller.update('4', dto)).resolves.toEqual({ id: 4 });
    expect(assignmentService.update).toHaveBeenCalledWith(4, dto);
  });

  it('delegates findAssignmentsByClass with a numeric classId', async () => {
    assignmentService.findAssignmentsByClass.mockResolvedValue([{ id: 1 }]);

    await expect(controller.findAssignmentsByClass('5')).resolves.toEqual([
      { id: 1 },
    ]);
    expect(assignmentService.findAssignmentsByClass).toHaveBeenCalledWith(5);
  });

  it('delegates import source requests with numeric ids', async () => {
    assignmentService.findImportSource.mockResolvedValue({ id: 2 });

    await expect(controller.findImportSource('5', '2')).resolves.toEqual({
      id: 2,
    });
    expect(assignmentService.findImportSource).toHaveBeenCalledWith(5, 2);
  });

  it('delegates import source listing with a numeric assignment id', async () => {
    assignmentService.findImportSources.mockResolvedValue([{ id: 2 }]);

    await expect(controller.findImportSources('5')).resolves.toEqual([
      { id: 2 },
    ]);
    expect(assignmentService.findImportSources).toHaveBeenCalledWith(5);
  });
});
