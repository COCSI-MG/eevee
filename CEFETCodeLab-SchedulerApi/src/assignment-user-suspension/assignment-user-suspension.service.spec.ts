import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentUserSuspensionService } from './assignment-user-suspension.service';

describe('AssignmentUserSuspensionService', () => {
  let service: AssignmentUserSuspensionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignmentUserSuspensionService],
    }).compile();

    service = module.get<AssignmentUserSuspensionService>(AssignmentUserSuspensionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
