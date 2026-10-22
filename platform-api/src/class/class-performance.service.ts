import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { AssignmentExecutionMode } from 'src/assignment/enums/assignment-execution-mode.enum';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { ClassAccessService } from 'src/auth/class-access.service';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { UserRole } from 'src/user/user-role';
import {
  buildPaginationMeta,
  buildPaginationParams,
} from 'src/common/pagination/pagination';
import { ClassPerformanceQueryDto } from './dto/request/class-performance.query.dto';
import { ClassActivityOptionDto } from './dto/response/class-activity-option.dto';
import { ClassInfosResponseDto } from './dto/response/class-infos-response.dto';
import { ClassPerformanceResponseDto } from './dto/response/class-performance-response.dto';
import type { ClassPerformanceAggregationRow } from './class-performance.interfaces';
import { CLASS_PERFORMANCE_QUERY } from './class-performance.query';

@Injectable()
export class ClassPerformanceService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignments: Repository<Assignment>,

    @InjectRepository(UserClass)
    private readonly enrollments: Repository<UserClass>,

    private readonly classAccess: ClassAccessService,
  ) {}

  async infos(classId: number): Promise<ClassInfosResponseDto> {
    const cls = await this.classAccess.assertTeacherAssignment(classId);
    const activities = await this.activities(classId)

    return {
      id: cls.id,
      name: cls.name,
      description: cls.description ?? null,
      deletedAt: cls.deletedAt ?? null,
      activities
    };
  }

  async performance(classId: number, query: ClassPerformanceQueryDto): Promise<ClassPerformanceResponseDto> {
    await this.classAccess.assertTeacherAssignment(classId);

    const activities = await this.activities(classId, query.activityIds);

    const { page, pageSize, skip } = buildPaginationParams(query);

    const { data, total } = await this.findPerformance(
      classId,
      query,
      activities,
      skip,
      pageSize
    );

    const meta = buildPaginationMeta(Number(total), page, pageSize)

    return {
      activities,
      data,
      meta
    };
  }

  private async activities(classId: number, activityIds?: number[]): Promise<ClassActivityOptionDto[]> {

    const mode = AssignmentExecutionMode.GRADED;

    const qb = this.assignments
      .createQueryBuilder('assignment')
      .select('assignment.id', 'id')
      .addSelect('assignment.title', 'title')
      .where('assignment.classId = :classId', { classId })
      .andWhere('assignment.executionMode = :mode', { mode })
      .orderBy('assignment.title', 'ASC')
      .addOrderBy('assignment.id', 'ASC');

    if (activityIds) qb.andWhere('assignment.id IN (:...activityIds)', { activityIds });

    const activities = await qb.getRawMany<ClassActivityOptionDto>();

    const uniqueIds = new Set(activityIds).size

    if (activityIds && activities.length !== uniqueIds) {
      throw new BadRequestException('Selecione apenas tarefas avaliadas desta turma.');
    }

    return activities;
  }

  private async findPerformance(
    classId: number,
    query: ClassPerformanceQueryDto,
    activities: ClassActivityOptionDto[],
    skip: number,
    pageSize: number
  ) : Promise<ClassPerformanceAggregationRow> {
    const search = query.search?.trim();
    const activitiesIds = activities.map((activity) => activity.id)

    const [result] = await this.enrollments.query<ClassPerformanceAggregationRow[]>(CLASS_PERFORMANCE_QUERY, [
      classId,
      UserRole.STUDENT,
      search ? `%${search}%` : null,
      skip,
      pageSize,
      activitiesIds,
      AttemptStatus.COMPLETED,
      AttemptStatus.FAILED
    ]);

    return result;
  }
}
