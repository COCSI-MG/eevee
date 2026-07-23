import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { AssignmentService } from 'src/assignment/assignment.service';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { CreateAssignmentDto } from 'src/assignment/dto/create-assignment.dto';
import { ClassService } from 'src/class/class.service';
import {
  PaginatedResult,
  buildPaginationMeta,
  buildPaginationParams,
} from 'src/common/pagination/pagination';
import { RequestContextService } from 'src/request-context/request-context.service';
import { UserClassService } from 'src/user-class/user-class.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { ListExamsByClassQueryDto } from './dto/list-exams-by-class.query.dto';
import { CreateAssignmentAndLinkResponseDto } from './dto/response/create-activity-and-link-response.dto';
import {
  AssignmentSummaryResponseDto,
  ExamWithAssignmentsResponseDto,
} from './dto/response/exam-with-activities-response.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamAssignment } from './entities/exam-assignment.entity';
import { Exam } from './entities/exam.entity';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamAssignment)
    private readonly examAssignmentRepository: Repository<ExamAssignment>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    private readonly classService: ClassService,
    private readonly userClassService: UserClassService,
    private readonly requestContextService: RequestContextService,
    private readonly dataSource: DataSource,
    private readonly assignmentService: AssignmentService,
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
      .leftJoinAndSelect(
        'assignment.suspensions',
        'suspensions',
        'suspensions.userId = :userId',
        { userId: user.userId },
      )
      .where('ea.examId = :examId', { examId })
      .orderBy('ea.id', 'ASC')
      .addOrderBy('assignmentAttempts.createdAt', 'DESC')
      .getMany();

    const mappedAssignments: AssignmentSummaryResponseDto[] = examAssignments.map(
      (ea) => {
        const a = ea.assignment;
        const attempts = a.assignmentAttempts ?? [];
        const lastAttempt = attempts[0] ?? null;

        const userSuspensions = a.suspensions ?? [];

        return {
          id: a.id,
          title: a.title,
          description: a.description,
          classId: a.classId,
          maxAttempts: a.maxAttempts,
          workerType: a.workerType,
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
          suspensions: userSuspensions.map((s) => ({
            id: s.id,
            reason: s.reason ?? null,
            createdAt: s.createdAt,
          })),
        };
      },
    );

    return { exam, assignments: mappedAssignments };
  }

  async linkAssignment(
    examId: number,
    assignmentId: number,
  ): Promise<ExamAssignment> {
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
      saved = await this.examAssignmentRepository.save({ examId, assignmentId });
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
    createAssignmentDto: CreateAssignmentDto,
  ): Promise<CreateAssignmentAndLinkResponseDto> {
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
        });
      } catch (error) {
        if (error && (error as { code?: string }).code === '23505') {
          throw new ConflictException(
            `Assignment with id ${newAssignment.id} is already linked to another exam`,
          );
        }
        throw error;
      }

      return { ...newAssignment, exam };
    });
  }
}
