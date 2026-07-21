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
import { CreateActivityAndLinkResponseDto } from './dto/response/create-activity-and-link-response.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamActivity } from './entities/exam-activity.entity';
import { Exam } from './entities/exam.entity';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamActivity)
    private readonly examActivityRepository: Repository<ExamActivity>,
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

    return this.examRepository.save({
      title: createExamDto.title,
      description: createExamDto.description,
      classId: createExamDto.classId,
      dueDate: createExamDto.dueDate
        ? new Date(createExamDto.dueDate)
        : undefined,
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

    const [rows, total] = await this.examRepository
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
      )
      .orderBy('exam.dueDate', sortDirection)
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return { data: rows, meta: buildPaginationMeta(total, page, pageSize) };
  }

  async linkActivity(
    examId: number,
    activityId: number,
  ): Promise<ExamActivity> {
    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Exam with id ${examId} not found`);
    }

    const activity = await this.assignmentRepository.findOne({
      where: { id: activityId },
    });
    if (!activity) {
      throw new NotFoundException(`Activity with id ${activityId} not found`);
    }

    let saved: ExamActivity;
    try {
      saved = await this.examActivityRepository.save({ examId, activityId });
    } catch (error) {
      if (error && (error as { code?: string }).code === '23505') {
        throw new ConflictException(
          `Activity with id ${activityId} is already linked to an exam`,
        );
      }
      throw error;
    }

    return this.examActivityRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['exam', 'activity'],
    });
  }

  async remove(id: number) {
    const exam = await this.examRepository.findOne({ where: { id } });
    if (!exam) {
      throw new NotFoundException(`Exam with id ${id} not found`);
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.delete(ExamActivity, { examId: id });
      return manager.delete(Exam, { id });
    });
  }

  async createActivityAndLink(
    examId: number,
    createAssignmentDto: CreateAssignmentDto,
  ): Promise<CreateActivityAndLinkResponseDto> {
    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Exam with id ${examId} not found`);
    }

    if (createAssignmentDto.classId !== exam.classId) {
      throw new BadRequestException(
        `Activity classId (${createAssignmentDto.classId}) does not match the exam's classId (${exam.classId})`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const newActivity = await this.assignmentService.create(
        createAssignmentDto,
        manager,
      );

      try {
        await manager.save(ExamActivity, {
          examId,
          activityId: newActivity.id,
        });
      } catch (error) {
        if (error && (error as { code?: string }).code === '23505') {
          throw new ConflictException(
            `Activity with id ${newActivity.id} is already linked to another exam`,
          );
        }
        throw error;
      }

      return { ...newActivity, exam };
    });
  }
}
