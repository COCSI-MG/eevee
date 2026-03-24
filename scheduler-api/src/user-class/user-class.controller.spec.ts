import { Test, TestingModule } from '@nestjs/testing';
import { UserClassController } from './user-class.controller';
import { UserClassService } from './user-class.service';

describe('UserClassController', () => {
  let controller: UserClassController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserClassController],
      providers: [UserClassService],
    }).compile();

    controller = module.get<UserClassController>(UserClassController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
