import { Test, TestingModule } from '@nestjs/testing';
import { UserClassService } from './user-class.service';

describe('UserClassService', () => {
  let service: UserClassService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserClassService],
    }).compile();

    service = module.get<UserClassService>(UserClassService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
