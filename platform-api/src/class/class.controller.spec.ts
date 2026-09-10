import { Test, TestingModule } from '@nestjs/testing';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';

describe('ClassController', () => {
  let controller: ClassController;
  let classService: {
    createOrReplace: jest.Mock;
    findAll: jest.Mock;
    findOptions: jest.Mock;
    findAllByUser: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    classService = {
      createOrReplace: jest.fn(),
      findAll: jest.fn(),
      findOptions: jest.fn(),
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
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
