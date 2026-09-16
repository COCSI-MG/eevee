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
    manager: {
      createQueryBuilder: jest.Mock;
    };
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
      distinctOn: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getCount: jest.fn(),
      getRawOne: jest.fn(),
      getQuery: jest.fn().mockReturnValue('SELECT latest attempts'),
      getParameters: jest.fn().mockReturnValue({ assignmentId: 99 }),
    };

    qb.clone.mockReturnValue(qb);
    return qb;
  };

  beforeEach(async () => {
    attemptRepository = {
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        createQueryBuilder: jest.fn(),
      },
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

  it('requires an assignment or class to list admin attempts', async () => {
    await expect(service.findAllForAdmin({})).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(attemptRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('maps grouped admin rows and paginates by user and assignment', async () => {
    const queryBuilder = makeQueryBuilder();
    const outerQueryBuilder = makeQueryBuilder();
    outerQueryBuilder.getRawMany.mockResolvedValue([
      {
        attemptId: '12',
        attemptNumber: '2',
        attemptStatus: AttemptStatus.RUNNING,
        attemptScore: '91.5',
        attemptCreatedAt: new Date('2026-04-18T10:00:00.000Z'),
        userId: '7',
        userEmail: 'alice@example.com',
        assignmentId: '99',
        assignmentTitle: 'Assignment title',
        attemptsCount: '4',
      },
    ]);
    queryBuilder.getRawOne.mockResolvedValue({ total: '3' });
    attemptRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    attemptRepository.manager.createQueryBuilder.mockReturnValue(
      outerQueryBuilder,
    );

    const query: ListAdminAttemptsQueryDto = {
      assignmentId: 99,
      userSearch: ' 7 ',
      page: 2,
      pageSize: 2,
    };

    await expect(service.findAllForAdmin(query)).resolves.toEqual({
      data: [
        {
          user: {
            id: 7,
            email: 'alice@example.com',
          },
          assignment: {
            id: 99,
            title: 'Assignment title',
          },
          attemptsCount: 4,
          lastAttempt: {
            id: 12,
            attempt: 2,
            status: AttemptStatus.RUNNING,
            score: 91.5,
            createdAt: new Date('2026-04-18T10:00:00.000Z'),
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

    expect(queryBuilder.distinctOn).toHaveBeenCalledWith([
      'attempt.userId',
      'attempt.assignmentId',
    ]);
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('attempt.userId', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'attempt.assignmentId',
      'ASC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('attempt.id', 'DESC');
    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      'COUNT(*) OVER (PARTITION BY attempt.userId, attempt.assignmentId)',
      'attemptsCount',
    );
    expect(queryBuilder.select).toHaveBeenCalledWith(
      'COUNT(DISTINCT (attempt.userId, attempt.assignmentId))',
      'total',
    );
    expect(outerQueryBuilder.offset).toHaveBeenCalledWith(2);
    expect(outerQueryBuilder.limit).toHaveBeenCalledWith(2);

    const searchBrackets = queryBuilder.andWhere.mock.calls[0][0] as {
      whereFactory: (expression: {
        where: jest.Mock;
        orWhere: jest.Mock;
      }) => void;
    };
    const searchExpression = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
    };
    searchBrackets.whereFactory(searchExpression);
    expect(searchExpression.where).toHaveBeenCalledWith(
      'LOWER(user.email) LIKE LOWER(:userEmail)',
      { userEmail: '%7%' },
    );
    expect(searchExpression.orWhere).toHaveBeenCalledWith('user.id = :userId', {
      userId: 7,
    });
  });

  it('filters admin attempts by class when no assignment is selected', async () => {
    const queryBuilder = makeQueryBuilder();
    const outerQueryBuilder = makeQueryBuilder();
    outerQueryBuilder.getRawMany.mockResolvedValue([]);
    queryBuilder.getRawOne.mockResolvedValue({ total: '0' });
    attemptRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    attemptRepository.manager.createQueryBuilder.mockReturnValue(
      outerQueryBuilder,
    );

    await service.findAllForAdmin({ classId: 8, page: 1, pageSize: 10 });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'assignment.classId = :classId',
      { classId: 8 },
    );
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'attempt.assignment',
      'assignment',
    );
    expect(queryBuilder.distinctOn).toHaveBeenCalledWith([
      'attempt.userId',
      'attempt.assignmentId',
    ]);
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('attempt.userId', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'attempt.assignmentId',
      'ASC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('attempt.id', 'DESC');
    expect(queryBuilder.select).toHaveBeenCalledWith(
      'COUNT(DISTINCT (attempt.userId, attempt.assignmentId))',
      'total',
    );
    expect(queryBuilder.leftJoin).toHaveBeenCalledTimes(1);
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith('attempt.user', 'user');

    const selectedFields = [
      ...queryBuilder.select.mock.calls,
      ...queryBuilder.addSelect.mock.calls,
    ].flat();
    expect(selectedFields).not.toContain('attempt.report');
    expect(selectedFields).not.toContain('attempt.receivedWork');
    expect(selectedFields).not.toContain('attempt.passes');
    expect(selectedFields).not.toContain('attempt.fails');
  });

  it('returns paginated attempts for an assignment and user ordered newest first', async () => {
    const queryBuilder = makeQueryBuilder();
    queryBuilder.getRawMany.mockResolvedValue([
      {
        id: '12',
        attempt: '2',
        status: AttemptStatus.COMPLETED,
        isAcceptable: true,
        score: '0.9',
        passes: '9',
        fails: '1',
        report: 'One test failed',
        receivedWork: { 'src/index.ts': 'export const answer = 42;' },
        createdAt: new Date('2026-04-18T10:00:00.000Z'),
      },
    ]);
    queryBuilder.getCount.mockResolvedValue(12);
    attemptRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    await expect(
      service.findAllForAdminByAssignmentAndUser(99, 7, {
        page: 2,
        pageSize: 5
      })
    ).resolves.toEqual({
      data: [
        {
          id: 12,
          attempt: 2,
          status: AttemptStatus.COMPLETED,
          isAcceptable: true,
          score: 0.9,
          passes: 9,
          fails: 1,
          report: 'One test failed',
          receivedWork: { 'src/index.ts': 'export const answer = 42;' },
          createdAt: new Date('2026-04-18T10:00:00.000Z')
        }
      ],
      meta: { total: 12, page: 2, pageSize: 5, totalPages: 3 }
    });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'attempt.assignmentId = :assignmentId',
      { assignmentId: 99 }
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'attempt.userId = :userId',
      { userId: 7 },
    );
    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      'attempt.receivedWork',
      'receivedWork',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('attempt.id', 'DESC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(queryBuilder.getCount).toHaveBeenCalled();
  });
});
