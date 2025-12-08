import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentUserSuspensionController } from './assignment-user-suspension.controller';
import { AssignmentUserSuspensionService } from './assignment-user-suspension.service';

describe('AssignmentUserSuspensionController', () => {
  let controller: AssignmentUserSuspensionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentUserSuspensionController],
      providers: [AssignmentUserSuspensionService],
    }).compile();

    controller = module.get<AssignmentUserSuspensionController>(AssignmentUserSuspensionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
