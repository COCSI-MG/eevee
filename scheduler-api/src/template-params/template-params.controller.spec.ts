import { Test, TestingModule } from '@nestjs/testing';
import { TemplateParamsController } from './template-params.controller';
import { TemplateParamsService } from './template-params.service';

describe('TemplateParamsController', () => {
  let controller: TemplateParamsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateParamsController],
      providers: [TemplateParamsService],
    }).compile();

    controller = module.get<TemplateParamsController>(TemplateParamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
