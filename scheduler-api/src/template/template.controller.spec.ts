import { Test, TestingModule } from '@nestjs/testing';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';

describe('TemplateController', () => {
  let controller: TemplateController;
  let templateService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    templateService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: [
        {
          provide: TemplateService,
          useValue: templateService,
        },
      ],
    }).compile();

    controller = module.get<TemplateController>(TemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates findAll preserving workerType filter', async () => {
    templateService.findAll.mockResolvedValue([{ id: 1 }]);

    await expect(controller.findAll('node_default' as any)).resolves.toEqual([
      { id: 1 },
    ]);
    expect(templateService.findAll).toHaveBeenCalledWith('node_default');
  });

  it('delegates update with a numeric id', async () => {
    const dto = { title: 'Updated template' } as any;
    templateService.update.mockResolvedValue({ id: 11 });

    await expect(controller.update('11', dto)).resolves.toEqual({ id: 11 });
    expect(templateService.update).toHaveBeenCalledWith(11, dto);
  });
});
