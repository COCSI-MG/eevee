import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from 'src/auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/user/user-role';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { CLASS_PERFORMANCE_QUERY } from './class-performance.query';
import { ClassPerformanceService } from './class-performance.service';
import { ClassPerformanceController } from './class-performance.controller';
import { ClassIdParamsDto } from './dto/request/class-id-params.dto';
import { ClassPerformanceQueryDto } from './dto/request/class-performance.query.dto';

function builder() {
  const qb: Record<string, jest.Mock> = {};
  ['select', 'addSelect', 'where', 'andWhere', 'orderBy', 'addOrderBy'].forEach((name) => {
      return (qb[name] = jest.fn(() => qb))
  });

  qb.getRawMany = jest.fn();

  return qb;
}

const userOne = {
  userId: 20,
  name: 'Ana'
}

describe('Class performance', () => {
  const activities = [
    { id: 12, title: 'A' },
    { id: 15, title: 'B' }
  ];

  const data = [
    {
      ...userOne,
      grades: [
        { activityId: 12, grade: 8 },
        { activityId: 15, grade: 0 }
      ],
      average: 4
    },
    {
      userId: 21,
      name: 'Bia',
      grades: [
        { activityId: 12, grade: 8 },
        { activityId: 15, grade: null }
      ],
      average: 4
    },
  ];

  let assignmentQb: ReturnType<typeof builder>;
  let enrollmentRepository: { query: jest.Mock };
  let access: { assertTeacherAssignment: jest.Mock };
  let service: ClassPerformanceService;

  beforeEach(() => {
    assignmentQb = builder();
    assignmentQb.getRawMany.mockResolvedValue(activities);
    enrollmentRepository = {
      query: jest.fn().mockResolvedValue([{ total: '25', data }])
    };
    access = {
      assertTeacherAssignment: jest.fn().mockResolvedValue({
        id: 17,
        name: 'Turma',
        description: null
      })
    };
    service = new ClassPerformanceService(
      { createQueryBuilder: () => assignmentQb } as any,
      enrollmentRepository as any,
      access as any
    );
  });

  it('returns database aggregation and builds pagination metadata', async () => {
    const result = await service.performance(17, { page: 2, pageSize: 10 });

    expect(result).toEqual({
      activities,
      data,
      meta: {
        total: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3
      }
    });
    expect(enrollmentRepository.query).toHaveBeenCalledWith(
      CLASS_PERFORMANCE_QUERY,
      [
        17,
        UserRole.STUDENT,
        null,
        10,
        10,
        [12, 15],
        AttemptStatus.COMPLETED,
        AttemptStatus.FAILED
      ]
    );
  });

  it('passes trimmed search as a parameter and preserves selected activity ordering', async () => {
    assignmentQb.getRawMany.mockResolvedValue([activities[1], activities[0]]);

    await service.performance(17, {
      search: "  Bia' OR 1=1 --  ",
      activityIds: [15, 12]
    });

    expect(enrollmentRepository.query).toHaveBeenCalledWith(
      CLASS_PERFORMANCE_QUERY,
      [
        17,
        UserRole.STUDENT,
        "%Bia' OR 1=1 --%",
        0,
        10,
        [15, 12],
        AttemptStatus.COMPLETED,
        AttemptStatus.FAILED
      ]
    );
  });

  it('keeps the total when the requested page is empty', async () => {
    enrollmentRepository.query.mockResolvedValue([{ total: '25', data: [] }]);

    const result = await service.performance(17, { page: 4, pageSize: 10 });

    expect(result.data).toEqual([]);
    expect(result.meta).toEqual({
      total: 25,
      page: 4,
      pageSize: 10,
      totalPages: 3
    })
  });

  it('passes an empty activity array for classes with no graded activities', async () => {
    assignmentQb.getRawMany.mockResolvedValue([]);
    enrollmentRepository.query.mockResolvedValue([
      {
        total: '1',
        data: [
          {
            ...userOne,
            grades: [],
            average: null
          }
        ]
      }
    ]);

    const result = await service.performance(17, {});

    expect(result.data[0]).toEqual({
      ...userOne,
      grades: [],
      average: null
    })

    expect(enrollmentRepository.query.mock.calls[0][1][5]).toEqual([])
  });

  it('rejects activities outside the class or without evaluation before querying performance', async () => {
    assignmentQb.getRawMany.mockResolvedValue([activities[0]]);

    await expect(service.performance(17, { activityIds: [12, 999] }))
        .rejects.toBeInstanceOf(BadRequestException);

    expect(enrollmentRepository.query).not.toHaveBeenCalled();
  });

  it('checks class ownership before reading either metadata or performance', async () => {
    access.assertTeacherAssignment.mockRejectedValue(new NotFoundException());

    await expect(service.infos(17)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.performance(17, {})).rejects.toBeInstanceOf(NotFoundException);

    expect(assignmentQb.getRawMany).not.toHaveBeenCalled();
    expect(enrollmentRepository.query).not.toHaveBeenCalled();
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
      '12, 15'
    ])('rejects malformed activity IDs: %s', async (activityIds) => {
      const result = pipe.transform({ activityIds }, metadata);

        await expect(result).rejects.toThrow(BadRequestException);
      }
    )
    it.each(['0', '-1', 'hello'])('rejects invalid class IDs: %s', async (id) => {
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
