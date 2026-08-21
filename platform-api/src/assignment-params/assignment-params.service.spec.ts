import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentParamsService } from './assignment-params.service';

describe('AssignmentParamsService', () => {
  let service: AssignmentParamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignmentParamsService],
    }).compile();

    service = module.get<AssignmentParamsService>(AssignmentParamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
