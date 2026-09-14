import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttemptService } from './attempt.service';
import { Attempt } from './entities/attempt.entity';
import { ClsService } from 'nestjs-cls';
import { AttemptStatus } from './enums/attempt-status.enum';
import { CreateAttemptDto } from './dto/create-applicant-attempt.dto';
import { ListAdminAttemptsQueryDto } from './dto/list-admin-attempts.query.dto';
import { BadRequestException } from '@nestjs/common';

describe('AttemptService', () => {
  let service: AttemptService;
  let attemptRepository: {
    save: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let clsService: {
    get: jest.Mock;
  };

  const makeQueryBuilder = () => {
    const qb: Record<string, jest.Mock> = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      withDeleted: jest.fn().mockReturnThis(),
      clone: jest.fn(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getCount: jest.fn(),
      getRawOne: jest.fn(),
    };

    qb.clone.mockReturnValue(qb);
    return qb;
  };

  beforeEach(async () => {
    attemptRepository = {
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    clsService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptService,
        {
          provide: getRepositoryToken(Attempt),
          useValue: attemptRepository,
        },
        { provide: ClsService, useValue: clsService },
      ],
    }).compile();

    service = module.get<AttemptService>(AttemptService);
  });

  it('creates an attempt with the userId from ClsService', async () => {
    clsService.get.mockReturnValue({ userId: 42 });
    attemptRepository.save.mockResolvedValue({
      id: 11,
      userId: 42,
      assignmentId: 7,
    });

    const dto: CreateAttemptDto = {
      attempt: 1,
      assignmentId: 7,
      fails: 0,
      isAcceptable: false,
      passes: 0,
      report: 'ok',
      score: 0,
      status: AttemptStatus.PENDING,
      receivedWork: { file: 'content' },
    };

    await expect(service.create(dto)).resolves.toEqual({
      id: 11,
      userId: 42,
      assignmentId: 7,
    });

    expect(attemptRepository.save).toHaveBeenCalledWith({
      ...dto,
      userId: 42,
    });
  });

  it('returns true when there are no previous attempts', async () => {
    clsService.get.mockReturnValue({ userId: 10 });
    attemptRepository.find.mockResolvedValue([]);

    await expect(service.isUserAbleToAttemptAssignment(99)).resolves.toBe(true);

    expect(attemptRepository.find).toHaveBeenCalledWith({
      relations: ['assignment'],
      where: {
        userId: 10,
        assignmentId: 99,
      },
      cache: {
        id: 'attempts-assignment-99-user-10',
        milliseconds: 1000 * 60 * 5,
      },
    });
  });

  it('returns false when maxAttempts is already reached', async () => {
    clsService.get.mockReturnValue({ userId: 10 });
    attemptRepository.find.mockResolvedValue([
      {
        assignment: { maxAttempts: 2 },
        status: AttemptStatus.COMPLETED,
      },
      {
        assignment: { maxAttempts: 2 },
        status: AttemptStatus.COMPLETED,
      },
    ]);

    await expect(service.isUserAbleToAttemptAssignment(99)).resolves.toBe(
      false,
    );
  });

  it('returns false when a running attempt exists', async () => {
    clsService.get.mockReturnValue({ userId: 10 });
    attemptRepository.find.mockResolvedValue([
      {
        assignment: { maxAttempts: 3 },
        status: AttemptStatus.RUNNING,
      },
      {
        assignment: { maxAttempts: 3 },
        status: AttemptStatus.COMPLETED,
      },
    ]);

    await expect(service.isUserAbleToAttemptAssignment(99)).resolves.toBe(
      false,
    );
  });

  it('returns the next attempt number based on the current maximum', async () => {
    const queryBuilder = makeQueryBuilder();
    queryBuilder.getRawOne.mockResolvedValue({ maxAttempt: '3' });
    attemptRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    await expect(service.getNextAttemptNumber(4, 9)).resolves.toBe(4);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'attempt.assignmentId = :assignmentId',
      { assignmentId: 4 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'attempt.userId = :userId',
      { userId: 9 },
    );
  });

  it('maps admin rows and meta correctly', async () => {
    const queryBuilder = makeQueryBuilder();
    queryBuilder.getRawMany.mockResolvedValue([
      {
        attempt_id: '12',
        attempt_attempt: '2',
        attempt_userId: '7',
        attempt_assignmentId: '99',
        attempt_status: AttemptStatus.RUNNING,
        attempt_isAcceptable: 1,
        attempt_score: '91.5',
        attempt_passes: '8',
        attempt_fails: '1',
        attempt_createdAt: new Date('2026-04-18T10:00:00.000Z'),
        user_id: '7',
        user_name: 'Alice',
        user_email: 'alice@example.com',
        user_isAdmin: 0,
        assignment_id: '99',
        assignment_title: 'Assignment title',
        assignment_description: 'Assignment description',
        assignment_workerType: 'worker-a',
      },
    ]);
    queryBuilder.getCount.mockResolvedValue(3);
    attemptRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const query: ListAdminAttemptsQueryDto = {
      assignmentId: 99,
      page: 2,
      pageSize: 2,
    };

    await expect(service.findAllForAdmin(query)).resolves.toEqual({
      data: [
        {
          id: 12,
          attempt: 2,
          userId: 7,
          assignmentId: 99,
          status: AttemptStatus.RUNNING,
          isAcceptable: true,
          score: 91.5,
          passes: 8,
          fails: 1,
          createdAt: new Date('2026-04-18T10:00:00.000Z'),
          user: {
            id: 7,
            name: 'Alice',
            email: 'alice@example.com',
            isAdmin: false,
          },
          assignment: {
            id: 99,
            title: 'Assignment title',
            description: 'Assignment description',
            workerType: 'worker-a',
          },
        },
      ],
      meta: {
        total: 3,
        page: 2,
        pageSize: 2,
        totalPages: 2,
      },
    });

    expect(queryBuilder.offset).toHaveBeenCalledWith(2);
    expect(queryBuilder.limit).toHaveBeenCalledWith(2);
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'attempt.id',
      'DESC',
    );
  });

  it('filters admin attempts by class when no assignment is selected', async () => {
    const queryBuilder = makeQueryBuilder();
    queryBuilder.getRawMany.mockResolvedValue([]);
    queryBuilder.getCount.mockResolvedValue(0);
    attemptRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    await service.findAllForAdmin({ classId: 8, page: 1, pageSize: 10 });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'assignment.classId = :classId',
      { classId: 8 },
    );
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'attempt.assignment',
      'assignment',
    );
  });
});
