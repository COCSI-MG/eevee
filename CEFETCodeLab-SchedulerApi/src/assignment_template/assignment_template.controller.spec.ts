import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentTemplateController } from './assignment_template.controller';
import { AssignmentTemplateService } from './assignment_template.service';

describe('AssignmentTemplateController', () => {
  let controller: AssignmentTemplateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentTemplateController],
      providers: [AssignmentTemplateService],
    }).compile();

    controller = module.get<AssignmentTemplateController>(AssignmentTemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
