import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentTemplateService } from './assignment_template.service';

describe('AssignmentTemplateService', () => {
  let service: AssignmentTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignmentTemplateService],
    }).compile();

    service = module.get<AssignmentTemplateService>(AssignmentTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
