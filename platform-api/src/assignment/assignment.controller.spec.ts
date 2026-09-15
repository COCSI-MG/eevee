import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';

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
