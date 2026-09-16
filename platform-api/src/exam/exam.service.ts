import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { AssignmentService } from 'src/assignment/assignment.service';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { CreateAndLinkAssignmentDto } from './dto/create-and-link-assignment.dto';
import { ClassService } from 'src/class/class.service';
import {
  PaginatedResult,
  buildPaginationMeta,
  buildPaginationParams,
} from 'src/common/pagination/pagination';
import { RequestContextService } from 'src/request-context/request-context.service';
import { User } from 'src/user/entities/user.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { UserClassService } from 'src/user-class/user-class.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { ListExamStudentsQueryDto } from './dto/list-exam-students.query.dto';
import { ListExamsByClassQueryDto } from './dto/list-exams-by-class.query.dto';
import { CreateAssignmentAndLinkResponseDto } from './dto/response/create-activity-and-link-response.dto';
import {
  ExamStudentAssignmentDto,
  ExamStudentGradesResponseDto,
} from './dto/response/exam-student-grades-response.dto';
import { PaginatedExamStudentsResponseDto } from './dto/response/paginated-exam-students-response.dto';
import {
  AssignmentSummaryResponseDto,
  ExamWithAssignmentsResponseDto,
} from './dto/response/exam-with-activities-response.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamAssignment } from './entities/exam-assignment.entity';
import { Exam } from './entities/exam.entity';
import { AssignmentAlertService } from 'src/assignment-alert/assignment-alert.service';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamAssignment)
    private readonly examAssignmentRepository: Repository<ExamAssignment>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attempt)
    private readonly attemptRepository: Repository<Attempt>,
    @InjectRepository(UserClass)
    private readonly userClassRepository: Repository<UserClass>,
    private readonly classService: ClassService,
    private readonly userClassService: UserClassService,
    private readonly requestContextService: RequestContextService,
    private readonly dataSource: DataSource,
    private readonly assignmentService: AssignmentService,
    private readonly assignmentAlertService: AssignmentAlertService,
  ) {}

  async create(createExamDto: CreateExamDto): Promise<Exam> {
    if (createExamDto.classId !== undefined) {
      const classExists = await this.classService.findOne(createExamDto.classId);
      if (!classExists) {
        throw new NotFoundException(
          `Class with id ${createExamDto.classId} not found`,
        );
      }
    }

    const startDate = createExamDto.startDate
      ? new Date(createExamDto.startDate)
      : undefined;

    const dueDate = createExamDto.dueDate
      ? new Date(createExamDto.dueDate)
      : undefined;

    if (startDate && dueDate && startDate > dueDate) {
      throw new BadRequestException('startDate must not be after dueDate');
    }

    return this.examRepository.save({
      title: createExamDto.title,
      description: createExamDto.description,
      classId: createExamDto.classId,
      dueDate,
      startDate,
    });
  }

  async update(examId: number, dto: UpdateExamDto): Promise<Exam> {
    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Exam with id ${examId} not found`);
    }

    const fieldsToUpdate: Partial<Exam> = {};
    if (dto.title !== undefined) fieldsToUpdate.title = dto.title;
    if (dto.description !== undefined) {
      fieldsToUpdate.description = dto.description;
    }
    if (dto.dueDate !== undefined) {
      fieldsToUpdate.dueDate = dto.dueDate
        ? new Date(dto.dueDate)
        : (null as unknown as Date);
    }
    if (dto.startDate !== undefined) {
      fieldsToUpdate.startDate = dto.startDate
        ? new Date(dto.startDate)
        : (null as unknown as Date);
    }

    const effectiveStartDate =
      fieldsToUpdate.startDate !== undefined
        ? fieldsToUpdate.startDate
        : exam.startDate;
    const effectiveDueDate =
      fieldsToUpdate.dueDate !== undefined
        ? fieldsToUpdate.dueDate
        : exam.dueDate;
    if (
      effectiveStartDate &&
      effectiveDueDate &&
      effectiveStartDate > effectiveDueDate
    ) {
      throw new BadRequestException('startDate must not be after dueDate');
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await this.examRepository.update(examId, fieldsToUpdate);
    }

    return this.examRepository.findOneOrFail({ where: { id: examId } });
  }

  async findByClass(
    classId: number,
    query: ListExamsByClassQueryDto,
  ): Promise<PaginatedResult<Exam>> {
    const classExists = await this.classService.findOne(classId);
    if (!classExists) {
      throw new NotFoundException(`Class with id ${classId} not found`);
    }

    const user = this.requestContextService.getUser();
    if (!user.isAdmin) {
      const enrollment = await this.userClassService.findOneByKeys(
        user.userId,
        classId,
      );
      if (!enrollment) {
        throw new ForbiddenException('You are not enrolled in this class.');
      }
    }

    const { page, pageSize, skip } = buildPaginationParams(query);
    const sortDirection = (query.sort ?? 'asc').toUpperCase() as 'ASC' | 'DESC';
    const search = query.search?.trim();

    const qb = this.examRepository
      .createQueryBuilder('exam')
      .where('exam.classId = :classId', { classId })
      .andWhere(
        search
          ? new Brackets((expr) => {
              expr
                .where('LOWER(exam.title) LIKE LOWER(:search)', {
                  search: `%${search}%`,
                })
                .orWhere('LOWER(exam.description) LIKE LOWER(:search)', {
                  search: `%${search}%`,
                });
            })
          : '1 = 1',
      );

    if (!user.isAdmin) {
      qb.andWhere(
        'exam.startDate IS NOT NULL AND exam.startDate <= :now',
        { now: new Date() },
      );
    }

    const [rows, total] = await qb
      .orderBy('exam.dueDate', sortDirection)
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return { data: rows, meta: buildPaginationMeta(total, page, pageSize) };
  }

  async findOneWithAssignments(
    examId: number,
  ): Promise<ExamWithAssignmentsResponseDto> {
    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Exam with id ${examId} not found`);
    }

    const user = this.requestContextService.getUser();
    if (!user.isAdmin) {
      if (exam.classId == null) {
        throw new ForbiddenException(
          'You are not allowed to view this exam.',
        );
      }
      const enrollment = await this.userClassService.findOneByKeys(
        user.userId,
        exam.classId,
      );
      if (!enrollment) {
        throw new ForbiddenException(
          'You are not enrolled in the class of this exam.',
        );
      }

      if (!exam.startDate || new Date() < exam.startDate) {
        throw new NotFoundException(`Exam with id ${examId} not found`);
      }
    }

    const examAssignments = await this.examAssignmentRepository
      .createQueryBuilder('ea')
      .innerJoinAndSelect('ea.assignment', 'assignment')
      .leftJoinAndSelect(
        'assignment.assignmentAttempts',
        'assignmentAttempts',
        'assignmentAttempts.userId = :userId',
        { userId: user.userId },
      )
      .where('ea.examId = :examId', { examId })
      .orderBy('ea.id', 'ASC')
      .addOrderBy('assignmentAttempts.createdAt', 'DESC');

    if (!user.isAdmin) {
      examAssignments.andWhere(
        '(assignment.startDate IS NULL OR assignment.startDate <= :now)',
        { now: new Date() }
      );
    }

    const assignmentLinks = await examAssignments.getMany();

    await this.assignmentAlertService.decorateAssignments(assignmentLinks.map((link) => link.assignment));

    const mappedAssignments: AssignmentSummaryResponseDto[] = assignmentLinks.map((ea) => {
        const a = ea.assignment;
        const attempts = a.assignmentAttempts ?? [];
        const lastAttempt = attempts[0] ?? null;

        return {
          id: a.id,
          title: a.title,
          description: a.description,
          classId: a.classId,
          maxAttempts: a.maxAttempts,
          startDate: a.startDate ?? null,
          dueDate: a.dueDate ?? null,
          workerType: a.workerType,
          score: ea.score,
          lastAttempt: lastAttempt
            ? {
                id: lastAttempt.id,
                attempt: lastAttempt.attempt,
                status: lastAttempt.status,
                score: lastAttempt.score,
                isAcceptable: lastAttempt.isAcceptable,
                passes: lastAttempt.passes,
                fails: lastAttempt.fails,
                createdAt: lastAttempt.createdAt,
              }
            : null,
          currentUserAlertStatus: a.currentUserAlertStatus ?? {
            activeCount: 0,
            limit: a.suspensionAlertLimit,
            suspended: false,
          },
        };
      });

    return { exam, assignments: mappedAssignments };
  }

  async findStudentsByExam(
    examId: number,
    query: ListExamStudentsQueryDto,
  ): Promise<PaginatedExamStudentsResponseDto> {
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['examAssignments', 'examAssignments.assignment'],
    });

    if (!exam) {
      throw new NotFoundException(`Exam with id ${examId} not found`);
    }

    if (exam.classId == null) {
      throw new BadRequestException(`Exam with id ${examId} has no class assigned`);
    }

    const examAssignments = exam.examAssignments ?? [];

    if (examAssignments.length === 0) {
      return { data: [], meta: buildPaginationMeta(0, query.page ?? 1, query.pageSize ?? 10) };
    }

    const assignmentIds = examAssignments.map((ea) => ea.assignmentId);

    const { page, pageSize, skip } = buildPaginationParams(query);

    const search = query.search?.trim();

    const qb = this.userClassRepository
      .createQueryBuilder('uc')
      .innerJoinAndSelect('uc.user', 'user')
      .where('uc.classId = :classId', { classId: exam.classId });

    if (search) {
      qb.andWhere('LOWER(user.name) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    const [userClasses, total] = await qb
      .orderBy('user.name', 'ASC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    if (userClasses.length === 0) {
      return { data: [], meta: buildPaginationMeta(total, page, pageSize) };
    }

    const studentIds = userClasses.map((uc) => uc.userId);
    const studentMap = new Map(userClasses.map((uc) =>  {
        return [
          uc.userId,
          {
            name: uc.user?.name,
            email: uc.user?.email
          }
        ]
    }));

    const { entities, raw } = await this.attemptRepository
      .createQueryBuilder('attempt')
      .distinctOn(['attempt.userId', 'attempt.assignmentId'])
      .addSelect(
        'COUNT(*) OVER (PARTITION BY attempt.userId, attempt.assignmentId)',
        'attemptsCount',
      )
      .where('attempt.assignmentId IN (:...assignmentIds)', { assignmentIds })
      .andWhere('attempt.userId IN (:...studentIds)', { studentIds })
      .andWhere('attempt.status = :status', { status: AttemptStatus.COMPLETED })
      .orderBy('attempt.userId', 'ASC')
      .addOrderBy('attempt.assignmentId', 'ASC')
      .addOrderBy('attempt.createdAt', 'DESC')
      .getRawAndEntities();

    const lastAttemptMap = new Map<string, Attempt>();
    const attemptCountMap = new Map<string, number>();
    entities.forEach((attempt, i) => {
      const key = `${attempt.userId}:${attempt.assignmentId}`;
      lastAttemptMap.set(key, attempt);
      attemptCountMap.set(key, Number(raw[i].attemptsCount));
    });

    const examMaxGrade = examAssignments.reduce((sum, ea) => sum + Number(ea.score), 0);

    const data: ExamStudentGradesResponseDto[] = studentIds.map((studentId) => {
      const studentInfo = studentMap.get(studentId);
      let examGrade = 0;

      const assignments: ExamStudentAssignmentDto[] = examAssignments.map((ea) => {
          const key = `${studentId}:${ea.assignmentId}`;
          const attempt = lastAttemptMap.get(key);
          const weight = Number(ea.score);

          if (attempt) {
            examGrade += weight * attempt.score;
          }

          return {
            assignmentId: ea.assignmentId,
            title: ea.assignment.title,
            weight,
            isAcceptable: attempt?.isAcceptable ?? false,
            score: attempt?.score ?? 0,
            passes: attempt?.passes ?? 0,
            fails: attempt?.fails ?? 0,
            attemptsCount: attemptCountMap.get(key) ?? 0,
            lastAttempt: attempt
              ? {
                  id: attempt.id,
                  status: attempt.status,
                  score: attempt.score,
                  isAcceptable: attempt.isAcceptable,
                  passes: attempt.passes,
                  fails: attempt.fails,
                  createdAt: attempt.createdAt,
                }
              : null,
          };
        });

      return {
        userId: studentId,
        name: studentInfo?.name ?? '',
        email: studentInfo?.email ?? '',
        totalAssignments: examAssignments.length,
        attemptedAssignments: assignments.filter((a) => a.attemptsCount > 0).length,
        approvedAssignments: assignments.filter((a) => a.isAcceptable).length,
        examGrade,
        maxExamGrade: examMaxGrade,
        assignments,
      };
    });

    return { data, meta: buildPaginationMeta(total, page, pageSize) };
  }

  async linkAssignment(
    examId: number,
    assignmentId: number,
    score: number,
  ): Promise<ExamAssignment> {
    if (score <= 0) {
      throw new BadRequestException('score must be greater than 0');
    }

    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Exam with id ${examId} not found`);
    }

    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with id ${assignmentId} not found`);
    }

    let saved: ExamAssignment;
    try {
      saved = await this.examAssignmentRepository.save({ examId, assignmentId, score });
    } catch (error) {
      if (error && (error as { code?: string }).code === '23505') {
        throw new ConflictException(
          `Assignment with id ${assignmentId} is already linked to an exam`,
        );
      }
      throw error;
    }

    return this.examAssignmentRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['exam', 'assignment'],
    });
  }

  async unlinkAssignment(examId: number, assignmentId: number): Promise<void> {
    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Exam with id ${examId} not found`);
    }

    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException(
        `Assignment with id ${assignmentId} not found`,
      );
    }

    const link = await this.examAssignmentRepository.findOne({
      where: { examId, assignmentId },
    });
    if (!link) {
      throw new NotFoundException(
        `Link between exam ${examId} and assignment ${assignmentId} does not exist`,
      );
    }

    await this.examAssignmentRepository.delete({ id: link.id });
  }

  async updateAssignmentScore(
    examId: number,
    assignmentId: number,
    score: number,
  ): Promise<ExamAssignment> {
    if (score <= 0) {
      throw new BadRequestException('score must be greater than 0');
    }

    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Exam with id ${examId} not found`);
    }

    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException(
        `Assignment with id ${assignmentId} not found`,
      );
    }

    const link = await this.examAssignmentRepository.findOne({
      where: { examId, assignmentId },
    });
    if (!link) {
      throw new NotFoundException(
        `Link between exam ${examId} and assignment ${assignmentId} does not exist`,
      );
    }

    await this.examAssignmentRepository.update(link.id, { score });

    return this.examAssignmentRepository.findOneOrFail({
      where: { id: link.id },
      relations: ['exam', 'assignment'],
    });
  }

  async remove(id: number) {
    const exam = await this.examRepository.findOne({ where: { id } });
    if (!exam) {
      throw new NotFoundException(`Exam with id ${id} not found`);
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.delete(ExamAssignment, { examId: id });
      return manager.delete(Exam, { id });
    });
  }

  async createAssignmentAndLink(
    examId: number,
    createAssignmentDto: CreateAndLinkAssignmentDto,
  ): Promise<CreateAssignmentAndLinkResponseDto> {
    if (createAssignmentDto.score <= 0) {
      throw new BadRequestException('score must be greater than 0');
    }

    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Exam with id ${examId} not found`);
    }

    if (createAssignmentDto.classId !== exam.classId) {
      throw new BadRequestException(
        `Assignment classId (${createAssignmentDto.classId}) does not match the exam's classId (${exam.classId})`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const newAssignment = await this.assignmentService.create(
        createAssignmentDto,
        manager,
      );

      try {
        await manager.save(ExamAssignment, {
          examId,
          assignmentId: newAssignment.id,
          score: createAssignmentDto.score,
        });
      } catch (error) {
        if (error && (error as { code?: string }).code === '23505') {
          throw new ConflictException(
            `Assignment with id ${newAssignment.id} is already linked to another exam`,
          );
        }
        throw error;
      }

      return { ...newAssignment, exam, score: createAssignmentDto.score };
    });
  }
}
