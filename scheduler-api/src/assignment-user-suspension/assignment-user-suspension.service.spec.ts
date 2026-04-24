import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssignmentUserSuspensionService } from './assignment-user-suspension.service';
import { AssignmentUserSuspension } from './entities/assignment-user-suspension.entity';

describe('AssignmentUserSuspensionService', () => {
  let service: AssignmentUserSuspensionService;
  let assignmentUserSuspensionRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(async () => {
    assignmentUserSuspensionRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentUserSuspensionService,
        {
          provide: getRepositoryToken(AssignmentUserSuspension),
          useValue: assignmentUserSuspensionRepository,
        },
      ],
    }).compile();

    service = module.get<AssignmentUserSuspensionService>(
      AssignmentUserSuspensionService,
    );
  });

  it('returns true or false depending on whether the suspension exists', async () => {
    assignmentUserSuspensionRepository.findOne.mockResolvedValueOnce({
      id: 1,
      userId: 2,
      assignmentId: 3,
    } as unknown as AssignmentUserSuspension);

    await expect(
      service.isUserSuspendedFromAssignment(2, 3),
    ).resolves.toBe(true);

    assignmentUserSuspensionRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      service.isUserSuspendedFromAssignment(2, 3),
    ).resolves.toBe(false);

    expect(assignmentUserSuspensionRepository.findOne).toHaveBeenCalledWith({
      where: {
        userId: 2,
        assignmentId: 3,
      },
    });
  });

  it('creates and saves a suspension with the provided reason', async () => {
    const suspension = {
      id: 11,
      userId: 4,
      assignmentId: 8,
      reason: 'cheating',
    } as unknown as AssignmentUserSuspension;

    assignmentUserSuspensionRepository.create.mockReturnValue(
      suspension as any,
    );
    assignmentUserSuspensionRepository.save.mockResolvedValue(suspension);

    const result = await service.suspendUserFromAssignment(4, 8, 'cheating');

    expect(assignmentUserSuspensionRepository.create).toHaveBeenCalledWith({
      userId: 4,
      assignmentId: 8,
      reason: 'cheating',
    });
    expect(assignmentUserSuspensionRepository.save).toHaveBeenCalledWith(
      suspension,
    );
    expect(result).toBe(suspension);
  });

  it('deletes by userId and assignmentId when removing a suspension', async () => {
    assignmentUserSuspensionRepository.delete.mockResolvedValue(
      { affected: 1 } as any,
    );

    await service.removeSuspensionFromAssignment(9, 10);

    expect(assignmentUserSuspensionRepository.delete).toHaveBeenCalledWith({
      userId: 9,
      assignmentId: 10,
    });
  });

  it('lists suspensions with user and assignment relations', async () => {
    assignmentUserSuspensionRepository.find.mockResolvedValue([
      {
        id: 1,
        userId: 2,
        assignmentId: 3,
      } as unknown as AssignmentUserSuspension,
    ]);

    await service.getSuspensionsByAssignmentId(3);

    expect(assignmentUserSuspensionRepository.find).toHaveBeenCalledWith({
      where: { assignmentId: 3 },
      relations: ['user', 'assignment'],
    });
  });

  it('delegates create to suspendUserFromAssignment', async () => {
    const spy = jest
      .spyOn(service, 'suspendUserFromAssignment')
      .mockResolvedValue({
        id: 15,
        userId: 6,
        assignmentId: 12,
        reason: 'late',
      } as AssignmentUserSuspension);

    const result = await service.create({
      userId: 6,
      assignmentId: 12,
      reason: 'late',
    } as any);

    expect(spy).toHaveBeenCalledWith(6, 12, 'late');
    expect(result).toEqual({
      id: 15,
      userId: 6,
      assignmentId: 12,
      reason: 'late',
    });
  });
});
