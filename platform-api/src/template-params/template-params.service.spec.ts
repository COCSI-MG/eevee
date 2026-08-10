import { Test, TestingModule } from '@nestjs/testing';
import { TemplateParamsService } from './template-params.service';

describe('TemplateParamsService', () => {
  let service: TemplateParamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateParamsService],
    }).compile();

    service = module.get<TemplateParamsService>(TemplateParamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
