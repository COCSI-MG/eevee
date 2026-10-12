import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { AssignmentExecutionMode } from 'src/assignment/enums/assignment-execution-mode.enum';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { ClassAccessService } from 'src/auth/class-access.service';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { UserRole } from 'src/user/user-role';
import {
  buildPaginationMeta,
  buildPaginationParams
} from 'src/common/pagination/pagination';
import { ClassPerformanceQueryDto } from './dto/request/class-performance.query.dto';
import { ClassActivityOptionDto } from './dto/response/class-activity-option.dto';
import { ClassInfosResponseDto } from './dto/response/class-infos-response.dto';
import { ClassPerformanceResponseDto } from './dto/response/class-performance-response.dto';

@Injectable()
export class ClassPerformanceService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignments: Repository<Assignment>,
    @InjectRepository(Attempt) private readonly attempts: Repository<Attempt>,
    @InjectRepository(UserClass)
    private readonly enrollments: Repository<UserClass>,
    private readonly classAccess: ClassAccessService
  ) {}

  private async activities(classId: number, activityIds?: number[]): Promise<ClassActivityOptionDto[]> {

    const qb = this.assignments
      .createQueryBuilder('assignment')
      .select('assignment.id', 'id')
      .addSelect('assignment.title', 'title')
      .where('assignment.classId = :classId', { classId })
      .andWhere('assignment.executionMode = :mode', { mode: AssignmentExecutionMode.GRADED })
      .orderBy('assignment.title', 'ASC')
      .addOrderBy('assignment.id', 'ASC');

    if (activityIds) qb.andWhere('assignment.id IN (:...activityIds)', { activityIds });

    const activities = await qb.getRawMany<ClassActivityOptionDto>();

    if (activityIds && activities.length !== new Set(activityIds).size) {
      throw new BadRequestException('Selecione apenas tarefas avaliadas desta turma.');
    }

    return activities;
  }

  async infos(classId: number): Promise<ClassInfosResponseDto> {
    const cls = await this.classAccess.assertTeacherAssignment(classId);

    return {
      id: cls.id,
      name: cls.name,
      description: cls.description ?? null,
      deletedAt: cls.deletedAt ?? null,
      activities: await this.activities(classId),
    };
  }

  async performance(
    classId: number,
    query: ClassPerformanceQueryDto,
  ): Promise<ClassPerformanceResponseDto> {
    await this.classAccess.assertTeacherAssignment(classId);

    const activities = await this.activities(classId, query.activityIds);

    const { page, pageSize, skip } = buildPaginationParams(query);

    const qb = this.enrollments
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.user', 'student')
      .where('enrollment.classId = :classId', { classId })
      .andWhere('student.role = :role', { role: UserRole.STUDENT });

    if (query.search?.trim()) {
      qb.andWhere('LOWER(student.name) LIKE LOWER(:search)', {
        search: `%${query.search.trim()}%`
      });
    }

    const [count, students] = await Promise.all([
      qb.clone()
        .select('COUNT(*)', 'total')
        .getRawOne<{ total: string }>(),

      qb.clone()
        .select('enrollment.userId', 'userId')
        .addSelect('student.name', 'name')
        .orderBy('student.name', 'ASC')
        .addOrderBy('enrollment.userId', 'ASC')
        .offset(skip)
        .limit(pageSize)
        .getRawMany<{ userId: number; name: string }>()
    ]);

    const grades = new Map<string, number>();

    if (students.length && activities.length) {
      const latest = await this.attempts
        .createQueryBuilder('attempt')
        .select('attempt.userId', 'userId')
        .addSelect('attempt.assignmentId', 'activityId')
        .addSelect('attempt.score', 'score')
        .addSelect('attempt.status', 'status')
        .distinctOn(['attempt.userId', 'attempt.assignmentId'])
        .where('attempt.userId IN (:...studentIds)', {
          studentIds: students.map((student) => student.userId)
        })
        .andWhere('attempt.assignmentId IN (:...activityIds)', {
          activityIds: activities.map((activity) => activity.id)
        })
        .andWhere('attempt.status IN (:...statuses)', {
          statuses: [AttemptStatus.COMPLETED, AttemptStatus.FAILED]
        })
        .orderBy('attempt.userId', 'ASC')
        .addOrderBy('attempt.assignmentId', 'ASC')
        .addOrderBy('attempt.createdAt', 'DESC')
        .addOrderBy('attempt.id', 'DESC')
        .getRawMany<{
          userId: number;
          activityId: number;
          score: number;
          status: AttemptStatus;
        }>();

      latest.forEach((attempt) => {
        const key = `${attempt.userId}:${attempt.activityId}`
        const value = attempt.status === AttemptStatus.FAILED ? 0 : Number(attempt.score) * 10

        return grades.set(key, value)
      });
    }

    return {
      activities,
      data: students.map((student) => {
        const studentGrades = activities.map((activity) => ({
          activityId: activity.id,
          grade: grades.get(`${student.userId}:${activity.id}`) ?? null
        }));

        const avg = studentGrades.reduce((sum, entry) => sum + (entry.grade ?? 0), 0) / activities.length

        return {
          ...student,
          grades: studentGrades,
          average: activities.length ? avg : null
        };
      }),
      meta: buildPaginationMeta(Number(count?.total ?? 0), page, pageSize)
    };
  }
}
