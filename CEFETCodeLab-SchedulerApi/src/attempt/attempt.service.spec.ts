import { Test, TestingModule } from '@nestjs/testing';
import { AttemptService } from './attempt.service';

describe('AttemptService', () => {
  let service: AttemptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttemptService],
    }).compile();

    service = module.get<AttemptService>(AttemptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
