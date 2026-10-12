import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  ValidationPipe
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from 'src/auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/user/user-role';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { ClassPerformanceService } from './class-performance.service';
import { ClassPerformanceController } from './class-performance.controller';
import { ClassIdParamsDto } from './dto/request/class-id-params.dto';
import { ClassPerformanceQueryDto } from './dto/request/class-performance.query.dto';

function builder() {
  const qb: Record<string, jest.Mock> = {};
  [
    'select',
    'addSelect',
    'where',
    'andWhere',
    'orderBy',
    'addOrderBy',
    'innerJoin',
    'offset',
    'limit',
    'distinctOn',
    'clone'
  ].forEach((name) => qb[name] = jest.fn(() => qb));

  qb.getRawMany = jest.fn();
  qb.getRawOne = jest.fn();

  return qb;
}

describe('Class performance', () => {
  const activities = [
    { id: 12, title: 'A' },
    { id: 15, title: 'B' }
  ];

  const students = [
    { userId: 20, name: 'Ana' },
    { userId: 21, name: 'Bia' }
  ];

  let assignmentQb: ReturnType<typeof builder>;
  let attemptQb: ReturnType<typeof builder>;
  let enrollmentQb: ReturnType<typeof builder>;
  let access: { assertTeacherAssignment: jest.Mock };
  let service: ClassPerformanceService;
  let attemptRepository: { createQueryBuilder: jest.Mock };

  beforeEach(() => {
    assignmentQb = builder();
    attemptQb = builder();
    enrollmentQb = builder();
    assignmentQb.getRawMany.mockResolvedValue(activities);
    enrollmentQb.getRawMany.mockResolvedValue(students);
    enrollmentQb.getRawOne.mockResolvedValue({ total: '25' });
    attemptQb.getRawMany.mockResolvedValue([
      {
        userId: 20,
        activityId: 12,
        score: 0.8,
        status: AttemptStatus.COMPLETED
      },
      {
        userId: 20,
        activityId: 15,
        score: 0,
        status: AttemptStatus.COMPLETED
      },
      {
        userId: 21,
        activityId: 12,
        score: 0.8,
        status: AttemptStatus.COMPLETED
      }
    ]);
    access = {
      assertTeacherAssignment: jest
        .fn()
        .mockResolvedValue({
          id: 17,
          name: 'Turma',
          description: null
        })
    };
    attemptRepository = { createQueryBuilder: jest.fn(() => attemptQb) };
    service = new ClassPerformanceService(
      { createQueryBuilder: () => assignmentQb } as any,
      attemptRepository as any,
      { createQueryBuilder: () => enrollmentQb } as any,
      access as any
    )
  })

  it('converts scores, distinguishes zero from absence, and includes both in the average', async () => {
    const result = await service.performance(17, { page: 2, pageSize: 10 });

    expect(result.data).toEqual([
      {
        ...students[0],
        grades: [
          { activityId: 12, grade: 8 },
          { activityId: 15, grade: 0 }
        ],
        average: 4
      },
      {
        ...students[1],
        grades: [
          { activityId: 12, grade: 8 },
          { activityId: 15, grade: null }
        ],
        average: 4
      }
    ]);

    expect(result.meta).toEqual({
      total: 25,
      page: 2,
      pageSize: 10,
      totalPages: 3
    });

    expect(enrollmentQb.offset).toHaveBeenCalledWith(10);
    expect(enrollmentQb.limit).toHaveBeenCalledWith(10);

    expect(enrollmentQb.select).toHaveBeenCalledWith(
      'enrollment.userId',
      'userId'
    );

    expect(enrollmentQb.addSelect).toHaveBeenCalledTimes(1);
    expect(enrollmentQb.where).toHaveBeenCalledWith(
      'enrollment.classId = :classId',
      { classId: 17 }
    );
    expect(attemptQb.where).toHaveBeenCalledWith(
      'attempt.userId IN (:...studentIds)',
      { studentIds: [20, 21] }
    );
    expect(attemptQb.andWhere).toHaveBeenCalledWith(
      'attempt.status IN (:...statuses)',
      { statuses: [ AttemptStatus.COMPLETED, AttemptStatus.FAILED ] }
    );
    expect(attemptQb.distinctOn).toHaveBeenCalledWith([ 'attempt.userId', 'attempt.assignmentId' ]);
    expect(attemptQb.orderBy).toHaveBeenCalledWith('attempt.userId', 'ASC');
    expect(attemptQb.addOrderBy.mock.calls).toEqual([
      ['attempt.assignmentId', 'ASC'],
      ['attempt.createdAt', 'DESC'],
      ['attempt.id', 'DESC']
    ]);
    expect(attemptQb.select).toHaveBeenCalledWith('attempt.userId', 'userId');
    expect(attemptQb.addSelect).toHaveBeenCalledWith('attempt.status', 'status');
    expect(attemptQb.addSelect).toHaveBeenCalledTimes(3);
    expect(attemptQb.getRawMany).toHaveBeenCalledTimes(1);
  });

  it.each([0, 0.8])(
    'returns zero for a failed attempt with stored score %s, while absence stays null',

    async (score) => {
      attemptQb.getRawMany.mockResolvedValue([
        {
          userId: 20,
          activityId: 12,
          score,
          status: AttemptStatus.FAILED
        },
        {
          userId: 20,
          activityId: 15,
          score: 0.8,
          status: AttemptStatus.COMPLETED
        }
      ]);

      const result = await service.performance(17, {});

      expect(result.data[0]).toEqual({
        ...students[0],
        grades: [
          { activityId: 12, grade: 0 },
          { activityId: 15, grade: 8 }
        ],
        average: 4
      });
      expect(result.data[1]).toEqual({
        ...students[1],
        grades: [
          { activityId: 12, grade: null },
          { activityId: 15, grade: null }
        ],
        average: 0
      });
    },
  );

  it('calculates the average only from selected activities, without intermediate rounding', async () => {
    assignmentQb.getRawMany.mockResolvedValue([activities[0]]);
    attemptQb.getRawMany.mockResolvedValue([
      {
        userId: 20,
        activityId: 12,
        score: 1 / 3,
        status: AttemptStatus.COMPLETED
      }
    ]);

    const result = await service.performance(17, { activityIds: [12] });

    expect(result.data[0].average).toBe((1 / 3) * 10);
    expect(result.data[1].average).toBe(0);
    expect(attemptQb.andWhere).toHaveBeenCalledWith(
      'attempt.assignmentId IN (:...activityIds)',
      { activityIds: [12] }
    );

  });

  it('returns students with no evaluation when the class has no graded activities', async () => {
    assignmentQb.getRawMany.mockResolvedValue([]);
    const result = await service.performance(17, {});

    expect(result.data[0]).toEqual({
      ...students[0],
      grades: [],
      average: null
    });
    expect(attemptRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('does not query attempts when the page has no enrolled students', async () => {
    enrollmentQb.getRawMany.mockResolvedValue([]);
    enrollmentQb.getRawOne.mockResolvedValue({ total: '0' });

    expect((await service.performance(17, {})).meta.total).toBe(0);
    expect(attemptRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects activities outside the class or without evaluation before querying students', async () => {
    assignmentQb.getRawMany.mockResolvedValue([activities[0]]);

    await expect(service.performance(17, { activityIds: [12, 999] }))
        .rejects.toBeInstanceOf(BadRequestException);

    expect(enrollmentQb.getRawMany).not.toHaveBeenCalled();
    expect(attemptRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('checks class ownership before reading either metadata or performance', async () => {
    access.assertTeacherAssignment.mockRejectedValue(new NotFoundException());

    await expect(service.infos(17)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.performance(17, {})).rejects.toBeInstanceOf(NotFoundException);

    expect(assignmentQb.getRawMany).not.toHaveBeenCalled();
    expect(enrollmentQb.getRawMany).not.toHaveBeenCalled();
  });

  it('returns only class metadata and graded activity options', async () => {
    expect(await service.infos(17)).toEqual({
      id: 17,
      name: 'Turma',
      description: null,
      deletedAt: null,
      activities
    });

    expect(assignmentQb.andWhere).toHaveBeenCalledWith(
      'assignment.executionMode = :mode',
      { mode: 'graded' }
    );
  });

  it('restricts both endpoints to authenticated administrators and teachers', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ClassPerformanceController)).toEqual([JwtAuthGuard, RolesGuard]);

    expect(Reflect.getMetadata(ROLES_KEY, ClassPerformanceController)).toEqual([ UserRole.ADMIN,UserRole.TEACHER ]);
  });

  it.each(['infos', 'performance'] as const)(
    'enforces role authorization for %s',
    (handler) => {
      const guard = new RolesGuard(new Reflector());

      const context = (role?: string) =>
        ({
          getClass: () => ClassPerformanceController,
          getHandler: () => ClassPerformanceController.prototype[handler],
          switchToHttp: () => ({
            getRequest: () => ({ user: role ? { role } : undefined })
          })
        }) as any;

      expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);

      expect(() => guard.canActivate(context(UserRole.STUDENT))).toThrow(ForbiddenException);
      expect(guard.canActivate(context(UserRole.TEACHER))).toBe(true);
      expect(guard.canActivate(context(UserRole.ADMIN))).toBe(true);
    },
  );

  describe('query validation', () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true
    });

    const metadata = {
      type: 'query' as const,
      metatype: ClassPerformanceQueryDto
    };

    it('parses multiple IDs and pagination', async () => {
      const result = await pipe.transform(
        {
          activityIds: '12,15',
          page: '2',
          pageSize: '10'
        },
        metadata
      );

      expect(result).toEqual({
        activityIds: [12, 15],
        page: 2,
        pageSize: 10
      });
    });
    it('accepts activity IDs already provided as a numeric array', async () => {
      const activityIds = [12, 15]
      const result = await pipe.transform(
        { activityIds },
        metadata
      );

      expect(result).toEqual({ activityIds });
    });
    it.each([
      '',
      '0',
      '-1',
      '1.5',
      '12,',
      '12,hello',
      '12, 15',
      '9999999999999'
    ])('rejects malformed activity IDs: %s', async (activityIds) => {
      const result = pipe.transform({ activityIds }, metadata);

      await expect(result).rejects.toThrow(BadRequestException);
    });
    it.each(['0', '-1', 'hello', '9999999999999'])
      ('rejects invalid class IDs: %s', async (id) => {
        const result = pipe.transform(
          { id },
          { type: 'param', metatype: ClassIdParamsDto }
        )

        await expect(result).rejects.toThrow(BadRequestException)
      },
    );
    it('rejects excessive page sizes', async () => {
      const results = pipe.transform({ pageSize: '101' }, metadata)

      await expect(results).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
