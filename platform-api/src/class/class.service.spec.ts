import { UserRole } from 'src/user/user-role';
import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassService } from './class.service';
import { Class } from './entities/class.entity';
import { UserClassService } from 'src/user-class/user-class.service';
import { RequestContextService } from 'src/request-context/request-context.service';
import { CreateOrReplaceClassDto } from './dto/request/create-or-replace-class.dto';
import { User } from 'src/user/entities/user.entity';
import { ClassAccessService } from 'src/auth/class-access.service';

describe('ClassService', () => {
  let service: ClassService;
  let classRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    find: jest.Mock;
    softDelete: jest.Mock;
    restore: jest.Mock;
    createQueryBuilder: jest.Mock;
    query: jest.Mock;
  };
  let userRepository: { findOne: jest.Mock; find: jest.Mock };
  let classAccessService: { assertClassAccess: jest.Mock };
  let userClassService: {
    createMany: jest.Mock;
    deleteByClassId: jest.Mock;
  };
  let requestContextService: {
    getUser: jest.Mock;
  };

  beforeEach(async () => {
    classRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      createQueryBuilder: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
    };
    userRepository = {
      findOne: jest.fn(),
      find: jest.fn().mockImplementation(async ({ where }: any) => {
        const ids: number[] = where.id?._value ?? [];

        return ids.map((id) => ({
          id,
          role: UserRole.STUDENT
        }))
      }),
    };
    userClassService = {
      createMany: jest.fn(),
      deleteByClassId: jest.fn(),
    };
    requestContextService = {
      getUser: jest.fn().mockReturnValue({ userId: 1, role: UserRole.ADMIN }),
    };
    classAccessService = {
      assertClassAccess: jest.fn(async (id: number) => {
        const cls = await classRepository.findOne({ where: { id } });
        if (!cls) throw new UnprocessableEntityException('Class not found.');
        return cls;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassService,
        {
          provide: getRepositoryToken(Class),
          useValue: classRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository
        },
        {
          provide: ClassAccessService,
          useValue: classAccessService,
        },
        {
          provide: UserClassService,
          useValue: userClassService,
        },
        {
          provide: RequestContextService,
          useValue: requestContextService,
        },
      ],
    }).compile();

    service = module.get<ClassService>(ClassService);
  });

  it('creates a new class and students when provided', async () => {
    classRepository.create.mockImplementation((data: Partial<Class>) => ({
      id: 10,
      ...data,
    } as Class));
    classRepository.save.mockResolvedValue({
      id: 10,
      name: 'Algorithms',
      description: 'Intro class',
    });

    const dto: CreateOrReplaceClassDto = {
      name: 'Algorithms',
      description: 'Intro class',
      students: [1, 2],
    };

    await expect(service.createOrReplace(dto)).resolves.toEqual({
      id: 10,
      name: 'Algorithms',
      description: 'Intro class',
      teacherId: null,
      deletedAt: null,
      users: [],
    });

    expect(classRepository.create).toHaveBeenCalledWith({
      name: 'Algorithms',
      description: 'Intro class',
      teacherId: null
    });
    expect(classRepository.save).toHaveBeenCalledWith({
      id: 10,
      name: 'Algorithms',
      description: 'Intro class',
      teacherId: null
    });
    expect(userClassService.createMany).toHaveBeenCalledWith([
      { userId: 1, classId: 10 },
      { userId: 2, classId: 10 },
    ]);
  });

  it('updates an existing class and clears previous links', async () => {
    classRepository.findOne.mockResolvedValue({
      id: 5,
      name: 'Old name',
      description: 'Old description',
    });
    classRepository.update.mockResolvedValue({ affected: 1 });
    userClassService.deleteByClassId.mockResolvedValue({ affected: 2 });

    const dto: CreateOrReplaceClassDto = {
      id: 5,
      name: 'New name',
      description: 'New description',
      students: [9],
    };

    await expect(service.createOrReplace(dto)).resolves.toEqual({
      id: 5,
      name: 'New name',
      description: 'New description',
      teacherId: null,
      deletedAt: null,
      users: [],
    });

    expect(classRepository.findOne).toHaveBeenCalledWith({ where: { id: 5 } });

    expect(classRepository.update).toHaveBeenCalledWith(5, {
      name: 'New name',
      description: 'New description',
    });
    expect(userClassService.deleteByClassId).toHaveBeenCalledWith(5);
    expect(userClassService.createMany).toHaveBeenCalledWith([
      { userId: 9, classId: 5 },
    ]);
  });

  it('throws when trying to replace a class that does not exist', async () => {
    classRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createOrReplace({
        id: 404,
        name: 'Missing',
        description: 'Missing',
        students: [1],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(classRepository.update).not.toHaveBeenCalled();
    expect(userClassService.deleteByClassId).not.toHaveBeenCalled();
  });

  it('archives a class only after checking manager access', async () => {
    classRepository.findOne.mockResolvedValue({
      id: 21,
      teacherId: 8
    });

    classRepository.softDelete.mockResolvedValue({ affected: 1 });

    await expect(service.remove(21)).resolves.toEqual({ affected: 1 });

    expect(classAccessService.assertClassAccess).toHaveBeenCalledWith(21, true);

    expect(classRepository.softDelete).toHaveBeenCalledWith({ id: 21 });
  });

  it('restores an archived class after controller authorization', async () => {
    const archivedClass = { id: 21, teacherId: 8, deletedAt: new Date() };
    classRepository.findOne.mockResolvedValue(archivedClass);
    classRepository.restore.mockResolvedValue({ affected: 1 });

    await expect(service.restore(21)).resolves.toEqual(archivedClass);

    expect(classRepository.restore).toHaveBeenCalledWith({ id: 21 });
  });

  it('blocks access to another user without admin rights', async () => {
    requestContextService.getUser.mockReturnValue({
      userId: 2,
      role: UserRole.STUDENT
    });

    await expect(service.findAllByUser(1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(classRepository.find).not.toHaveBeenCalled();
    expect(classRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(classRepository.query).not.toHaveBeenCalled();
  });

  it('returns every class for an admin regardless of enrollment', async () => {
    requestContextService.getUser.mockReturnValue({
      userId: 2,
      role: UserRole.ADMIN
    });
    classRepository.find.mockResolvedValue([
      {
        id: 7,
        name: 'Algorithms',
        description: 'Intro class',
      },
      {
        id: 8,
        name: 'Databases',
        description: 'Advanced class',
      },
    ]);

    classRepository.query.mockResolvedValue([
      { id: 8, exams: 3, practices: 2, quizzes: 1 },
      { id: 7, exams: 1, practices: 0, quizzes: 4 },
    ]);

    await expect(service.findAllByUser(999)).resolves.toEqual([
      {
        id: 7,
        name: 'Algorithms',
        description: 'Intro class',
        activityCounts: { exams: 1, practices: 0, quizzes: 4 },
      },
      {
        id: 8,
        name: 'Databases',
        description: 'Advanced class',
        activityCounts: { exams: 3, practices: 2, quizzes: 1 },
      },
    ]);

    expect(classRepository.find).toHaveBeenCalledWith({
      relations: [
        'userClasses',
        'userClasses.user',
        'userClasses.class',
        'assignments',
      ],
    });

    expect(classRepository.query).toHaveBeenCalledWith(
      expect.any(String),
      [[7, 8], true, expect.any(Date), true],
    );
  });

  it('returns owned classes and unrestricted exam counts for a teacher', async () => {
    requestContextService.getUser.mockReturnValue({
      userId: 8,
      role: UserRole.TEACHER,
    });
    classRepository.find.mockResolvedValue([{ id: 21, teacherId: 8 }]);
    classRepository.query.mockResolvedValue([
      { id: 21, exams: 5, practices: 2, quizzes: 1 },
    ]);

    await expect(service.findAllByUser(8)).resolves.toEqual([
      {
        id: 21,
        teacherId: 8,
        activityCounts: { exams: 5, practices: 2, quizzes: 1 },
      },
    ]);

    expect(classRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teacherId: 8 } }),
    );
    expect(classRepository.query).toHaveBeenCalledWith(
      expect.stringContaining('$4::boolean OR (e."startDate"'),
      [[21], false, expect.any(Date), true],
    );
    expect(classRepository.query.mock.calls[0][0]).toContain(
      '$2::boolean OR (a.published',
    );
  });

  it('returns zero activity counts when a class has no summary', async () => {
    classRepository.find.mockResolvedValue([{ id: 21 }]);

    await expect(service.findAllByUser(1)).resolves.toEqual([
      { id: 21, activityCounts: { exams: 0, practices: 0, quizzes: 0 } },
    ]);
  });

  it('skips activity counts when no classes are found', async () => {
    classRepository.find.mockResolvedValue([]);

    await expect(service.findAllByUser(1)).resolves.toEqual([]);

    expect(classRepository.query).not.toHaveBeenCalled();
  });

  it('lists only id and name for filter options', async () => {
    classRepository.find.mockResolvedValue([{ id: 1, name: 'Algorithms' }]);

    await expect(service.findOptions()).resolves.toEqual([
      { id: 1, name: 'Algorithms' },
    ]);
    expect(classRepository.find).toHaveBeenCalledWith({
      select: { id: true, name: true },
      order: { name: 'ASC', id: 'ASC' },
    });
  });

  it('queries classes correctly when access is allowed', async () => {
    requestContextService.getUser.mockReturnValue({
      userId: 7,
      role: UserRole.STUDENT
    });
    const classesForStudent = [
      {
        id: 7,
        name: 'Algorithms',
        description: 'Intro class',
      },
    ];

    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(classesForStudent),
    };
    classRepository.createQueryBuilder.mockReturnValue(qb);
    classRepository.query.mockResolvedValue([
      { id: 7, exams: 2, practices: 1, quizzes: 0 },
    ]);

    await expect(service.findAllByUser(7)).resolves.toEqual([
      {
        ...classesForStudent[0],
        activityCounts: { exams: 2, practices: 1, quizzes: 0 },
      },
    ]);

    expect(classRepository.find).not.toHaveBeenCalled();
    expect(classRepository.query).toHaveBeenCalledWith(
      expect.any(String),
      [[7], false, expect.any(Date), false],
    );

    expect(qb.innerJoin).toHaveBeenCalledWith(
      'class.userClasses',
      'userClass',
      'userClass.userId = :userId',
      { userId: 7 }
    );

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('exam.startDate IS NOT NULL'),
      expect.objectContaining({ now: expect.any(Date) })
    );

    expect(qb.leftJoinAndSelect).not.toHaveBeenCalledWith(
      'class.userClasses',
      expect.anything()
    );
  });

  describe('findAllPaginated', () => {
    const makeQueryBuilder = () => {
      const qb: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        clone: jest.fn(),
        getManyAndCount: jest.fn(),
      };
      qb.clone.mockReturnValue(qb);
      return qb;
    };

    it('paginates classes with search across name and description', async () => {
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([
        [
          {
            id: 1,
            name: 'Math 101',
            description: 'Intro',
            userClasses: [],
          },
        ],
        1,
      ]);
      classRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllPaginated({
        search: 'mat',
        page: 1,
        pageSize: 10,
      } as any);

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(qb.andWhere).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ total: 1, page: 1, pageSize: 10, totalPages: 1 });
    });
  });
});
