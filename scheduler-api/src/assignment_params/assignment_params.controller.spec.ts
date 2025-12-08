import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentParamsController } from './assignment_params.controller';
import { AssignmentParamsService } from './assignment_params.service';

describe('AssignmentParamsController', () => {
  let controller: AssignmentParamsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentParamsController],
      providers: [AssignmentParamsService],
    }).compile();

    controller = module.get<AssignmentParamsController>(AssignmentParamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
