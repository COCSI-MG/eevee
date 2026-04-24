import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { AssignmentUserSuspensionController } from './assignment-user-suspension.controller';
import { AssignmentUserSuspensionService } from './assignment-user-suspension.service';

describe('AssignmentUserSuspensionController', () => {
  let controller: AssignmentUserSuspensionController;
  let assignmentUserSuspensionService: {
    create: jest.Mock;
    getSuspensionsByAssignmentId: jest.Mock;
    suspendUserFromAssignment: jest.Mock;
    removeSuspensionFromAssignment: jest.Mock;
    isUserSuspendedFromAssignment: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let clsService: { get: jest.Mock };

  beforeEach(async () => {
    assignmentUserSuspensionService = {
      create: jest.fn(),
      getSuspensionsByAssignmentId: jest.fn(),
      suspendUserFromAssignment: jest.fn(),
      removeSuspensionFromAssignment: jest.fn(),
      isUserSuspendedFromAssignment: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    clsService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentUserSuspensionController],
      providers: [
        {
          provide: AssignmentUserSuspensionService,
          useValue: assignmentUserSuspensionService,
        },
        {
          provide: ClsService,
          useValue: clsService,
        },
      ],
    }).compile();

    controller = module.get<AssignmentUserSuspensionController>(
      AssignmentUserSuspensionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('suspends the current user using the session userId', async () => {
    clsService.get.mockReturnValue({ userId: 17 });
    assignmentUserSuspensionService.suspendUserFromAssignment.mockResolvedValue({
      id: 1,
    });

    await expect(
      controller.suspendUserFromAssignment({
        assignmentId: 9,
        reason: 'manual block',
      } as any),
    ).resolves.toEqual({ id: 1 });

    expect(
      assignmentUserSuspensionService.suspendUserFromAssignment,
    ).toHaveBeenCalledWith(17, 9, 'manual block');
  });

  it('returns the suspension status for the current user', async () => {
    clsService.get.mockReturnValue({ userId: 5 });
    assignmentUserSuspensionService.isUserSuspendedFromAssignment.mockResolvedValue(
      true,
    );

    await expect(
      controller.isUserSuspendedFromAssignment('12'),
    ).resolves.toEqual({
      message: 'User is suspended from this assignment.',
      suspended: true,
    });
  });
});
