import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import {
  Brackets,
  DataSource,
  EntityManager,
  FindOneOptions,
  In,
  IsNull,
  Repository,
} from 'typeorm';
import { RequestContextService } from 'src/request-context/request-context.service';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { ClassService } from 'src/class/class.service';
import { AssignmentTemplate } from 'src/assignment-template/entities/assignment-template.entity';
import { AssignmentParam } from 'src/assignment-params/entities/assignment-param.entity';
import { Template } from 'src/template/entities/template.entity';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { ListAssignmentsByClassQueryDto } from './dto/list-assignments-by-class.query.dto';
import { ListAssignmentsQueryDto } from './dto/list-assignments.query.dto';
import {
  PaginatedResult,
  buildPaginationMeta,
  buildPaginationParams,
} from 'src/common/pagination/pagination';

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssignmentTemplate)
    private readonly assignmentTemplateRepository: Repository<AssignmentTemplate>,
    @InjectRepository(AssignmentParam)
    private readonly assignmentParamsRepository: Repository<AssignmentParam>,
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(UserClass)
    private readonly userClassRepository: Repository<UserClass>,
    @InjectRepository(Attempt)
    private readonly attemptRepository: Repository<Attempt>,
    private readonly classservice: ClassService,
    private dataSource: DataSource,
    private readonly requestContextService: RequestContextService,
  ) {}

  private async assertTemplatesCompatibleWithWorkerType(options: {
    templates: { templateId: number }[];
    workerType: Assignment['workerType'];
    templateRepo?: Repository<Template>;
  }): Promise<void> {
    const templateRepo = options.templateRepo ?? this.templateRepository;
    const templateIds = options.templates.map((t) => t.templateId);
    if (!templateIds.length) return;

    const found = await templateRepo.find({
      where: { id: In(templateIds) },
      select: { id: true, workerType: true },
    });

    if (found.length !== templateIds.length) {
      const foundIds = new Set(found.map((t) => t.id));
      const missing = templateIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Template(s) not found: ${missing.join(', ')}`,
      );
    }

    const incompatible = found.filter(
      (t) => t.workerType !== options.workerType,
    );
    if (incompatible.length) {
      throw new ForbiddenException(
        `Template(s) not compatible with workerType=${options.workerType}: ${incompatible
          .map((t) => t.id)
          .join(', ')}`,
      );
    }
  }

  private async readLegacyBoilerplateFileContent(
    boilerplateFilePath?: string,
  ): Promise<string> {
    if (!boilerplateFilePath) return '';

    try {
      const absolutePath = path.resolve(
        process.cwd(),
        'assignments-upload',
        boilerplateFilePath,
      );
      return await fs.readFile(absolutePath, 'utf-8');
    } catch {
      return '';
    }
  }

  private async resolveStoredBoilerplateContent(
    assignment: Pick<Assignment, 'boilerplateContent' | 'boilerplateFilePath'>,
  ): Promise<string> {
    if (typeof assignment.boilerplateContent === 'string') {
      return assignment.boilerplateContent;
    }

    return this.readLegacyBoilerplateFileContent(
      assignment.boilerplateFilePath,
    );
  }

  private resolvePayloadBoilerplateContent(payload: {
    boilerplateContent?: unknown;
    boilerplate?: unknown;
    validationScript?: unknown;
  }): string | undefined {
    if (typeof payload.boilerplateContent === 'string') {
      return payload.boilerplateContent;
    }

    if (typeof payload.boilerplate === 'string') {
      return payload.boilerplate;
    }

    if (typeof payload.validationScript === 'string') {
      return payload.validationScript;
    }

    return undefined;
  }

  private async attachBoilerplate(assignment: Assignment) {
    const boilerplateContent =
      await this.resolveStoredBoilerplateContent(assignment);

    return {
      ...assignment,
      // DB source of truth
      boilerplateContent,
      // Preferred name
      boilerplate: boilerplateContent,
      // Backward compatible alias for older frontends
      validationScript: boilerplateContent,
    };
  }

  private getTeacherVisibilityWhere(): FindOneOptions<Assignment>['where'] {
    const user = this.requestContextService.getUser();
    if (!user?.isAdmin) return undefined;
    return [{ createdById: user.userId }, { createdById: IsNull() }];
  }

  private assertTeacherOwnsAssignment(assignment: Assignment): void {
    const user = this.requestContextService.getUser();
    if (!user?.isAdmin) return;

    // Legacy assignments (createdById IS NULL) are accessible to teachers, but once
    // updated they'll be "claimed" by that teacher (see update()).
    if (assignment.createdById && assignment.createdById !== user.userId) {
      throw new ForbiddenException(
        'You are not authorized to access this assignment.',
      );
    }
  }

  async create(
    createAssignmentDto: CreateAssignmentDto,
    manager?: EntityManager,
  ) {
    const assignmentRepo = manager
      ? manager.getRepository(Assignment)
      : this.assignmentRepository;
    const assignmentTemplateRepo = manager
      ? manager.getRepository(AssignmentTemplate)
      : this.assignmentTemplateRepository;
    const assignmentParamRepo = manager
      ? manager.getRepository(AssignmentParam)
      : this.assignmentParamsRepository;
    const templateRepo = manager
      ? manager.getRepository(Template)
      : this.templateRepository;

    const {
      templates,
      boilerplateContent,
      boilerplate,
      validationScript,
      ...assignmentData
    } = createAssignmentDto;

    const classExists = await this.classservice.findOne(
      createAssignmentDto.classId,
    );

    if (!classExists) {
      throw new NotFoundException(
        `Class with id ${createAssignmentDto.classId} not found`,
      );
    }

    const user = this.requestContextService.getUser();

    const resolvedBoilerplateContent = this.resolvePayloadBoilerplateContent({
      boilerplateContent,
      boilerplate,
      validationScript,
    });

    const newAssignment = await assignmentRepo.save({
      classId: assignmentData.classId,
      title: assignmentData.title,
      description: assignmentData.description,
      maxAttempts: assignmentData.maxAttempts,
      workerType: assignmentData.workerType,
      initSqlScript: assignmentData.initSqlScript,
      boilerplateContent: resolvedBoilerplateContent,
      createdById: user?.userId,
    });

    if (templates && templates.length > 0) {
      await this.assertTemplatesCompatibleWithWorkerType({
        templates,
        workerType: assignmentData.workerType,
        templateRepo,
      });

      const assignmentTemplateEntities = templates.map((template) => ({
        assignmentId: newAssignment.id,
        templateId: template.templateId,
      }));

      const assignmentParamsEntities = templates.flatMap((template) =>
        template.params.map((param) => ({
          assignmentId: newAssignment.id,
          templateParamsId: param.templateParamId,
          value: param.value,
        })),
      );

      await assignmentTemplateRepo.save(assignmentTemplateEntities);
      await assignmentParamRepo.save(assignmentParamsEntities);
    }

    return await this.attachBoilerplate(newAssignment);
  }

  async findAllUserAssignments() {
    const user = this.requestContextService.getUser();

    const query = this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.class', 'class')
      .innerJoin(
        'class.userClasses',
        'userClasses',
        'userClasses.userId = :userId',
        { userId: user.userId },
      )
      .leftJoinAndSelect(
        'assignment.assignmentAttempts',
        'assignmentAttempts',
        'assignmentAttempts.userId = :userId',
        { userId: user.userId },
      )
      .leftJoinAndSelect('assignment.suspensions', 'suspensions');

    const assignments = await query.getMany();

    this.logger.debug(assignments, 'Assignments fetched for user');

    return Promise.all(assignments.map((a) => this.attachBoilerplate(a)));
  }

  findAll() {
    const user = this.requestContextService.getUser();

    return this.assignmentRepository
      .find({
        relations: [
          'assignmentAttempts',
          'class',
          'class.userClasses',
          'suspensions',
        ],
        where: user?.isAdmin ? this.getTeacherVisibilityWhere() : undefined,
      })
      .then((assignments) =>
        Promise.all(assignments.map((a) => this.attachBoilerplate(a))),
      );
  }

  async findAllPaginated(
    query: ListAssignmentsQueryDto,
  ): Promise<PaginatedResult<Assignment>> {
    const { page, pageSize, skip } = buildPaginationParams(query);
    const visibilityWhere = this.getTeacherVisibilityWhere();

    const qb = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.assignmentAttempts', 'assignmentAttempts')
      .leftJoinAndSelect('assignment.class', 'class')
      .leftJoinAndSelect('class.userClasses', 'userClasses')
      .leftJoinAndSelect('assignment.suspensions', 'suspensions')
      .orderBy('assignment.id', 'DESC');

    if (visibilityWhere) {
      qb.where(visibilityWhere as any);
    }

    const search = query.search?.trim();
    if (search) {
      qb.andWhere(
        new Brackets((expr) => {
          expr
            .where('LOWER(assignment.title) LIKE LOWER(:search)', {
              search: `%${search}%`,
            })
            .orWhere('LOWER(class.name) LIKE LOWER(:search)', {
              search: `%${search}%`,
            })
            .orWhere('LOWER(assignment.workerType) LIKE LOWER(:search)', {
              search: `%${search}%`,
            });
        }),
      );
    }

    const [rows, total] = await qb
      .clone()
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();
    const data = await Promise.all(
      rows.map((assignment) => this.attachBoilerplate(assignment)),
    );

    return { data, meta: buildPaginationMeta(total, page, pageSize) };
  }

  async findAssignmentsByClass(
    classId: number,
    queryParams?: ListAssignmentsByClassQueryDto,
  ) {
    const user = this.requestContextService.getUser()!;

    if (!user.isAdmin) {
      const isUserInClass = await this.userClassRepository.findOne({
        where: {
          userId: user.userId,
          classId,
        },
      });

      if (!isUserInClass) {
        throw new ForbiddenException(
          'You are not authorized to access this class.',
        );
      }
    }

    const query = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect(
        'assignment.assignmentAttempts',
        'assignmentAttempts',
        'assignmentAttempts.userId = :userId',
        { userId: user.userId },
      )
      .leftJoinAndSelect('assignment.suspensions', 'suspensions')
      .leftJoin('assignment.examActivity', 'examActivity')
      .where('assignment.classId = :classId', { classId });

    if (queryParams?.linkedToExam === true) {
      query.andWhere('examActivity.id IS NULL');
    } else if (queryParams?.linkedToExam === false) {
      query.andWhere('examActivity.id IS NOT NULL');
    }

    if (user?.isAdmin) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('assignment.createdById = :userId', {
            userId: user.userId,
          }).orWhere('assignment.createdById IS NULL');
        }),
      );
    }

    const assignments = await query.getMany();

    return Promise.all(assignments.map((a) => this.attachBoilerplate(a)));
  }

  async findOne(id: number) {
    const user = this.requestContextService.getUser();

    const query = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.class', 'class')
      .leftJoinAndSelect('assignment.assignmentParams', 'assignmentParams')
      .leftJoinAndSelect(
        'assignment.assignmentTemplates',
        'assignmentTemplates',
      )
      .leftJoinAndSelect('assignmentTemplates.template', 'template')
      .leftJoinAndSelect('template.templateParams', 'templateParams')
      .leftJoinAndSelect('assignment.suspensions', 'suspensions')
      .where('assignment.id = :id', { id })
      .orderBy('assignmentAttempts.createdAt', 'DESC');

    if (user.isAdmin) {
      query
        .leftJoinAndSelect('class.userClasses', 'userClasses')
        .leftJoinAndSelect(
          'assignment.assignmentAttempts',
          'assignmentAttempts',
        )
        .andWhere(
          new Brackets((qb) => {
            qb.where('assignment.createdById = :userId', {
              userId: user.userId,
            }).orWhere('assignment.createdById IS NULL');
          }),
        );
    } else {
      query
        .leftJoinAndSelect(
          'assignment.assignmentAttempts',
          'assignmentAttempts',
          'assignmentAttempts.userId = :userId',
          { userId: user.userId },
        )
        .innerJoinAndSelect(
          'class.userClasses',
          'userClasses',
          'userClasses.userId = :userId',
          { userId: user.userId },
        );
    }

    const response = await query.getOne();
    if (!response) {
      throw new NotFoundException('Assignment not found');
    }

    return await this.attachBoilerplate(response);
  }

  async update(id: number, updateAssignmentDto: UpdateAssignmentDto) {
    const {
      templates,
      boilerplateContent,
      boilerplate,
      validationScript,
      ...dataToUpdate
    } = updateAssignmentDto;

    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    this.assertTeacherOwnsAssignment(assignment);

    const user = this.requestContextService.getUser();
    if (user?.isAdmin && !assignment.createdById) {
      await this.assignmentRepository.update(id, { createdById: user.userId });
      assignment.createdById = user.userId;
    }

    const resolvedBoilerplateContent = this.resolvePayloadBoilerplateContent({
      boilerplateContent,
      boilerplate,
      validationScript,
    });

    if (typeof resolvedBoilerplateContent === 'string') {
      await this.assignmentRepository.update(assignment.id, {
        boilerplateContent: resolvedBoilerplateContent,
      });

      assignment.boilerplateContent = resolvedBoilerplateContent;
    }

    if (Object.keys(dataToUpdate).length > 0)
      await this.assignmentRepository.update(id, dataToUpdate);

    if (
      updateAssignmentDto.templates &&
      updateAssignmentDto.templates.length > 0
    ) {
      const effectiveWorkerType =
        (dataToUpdate as any).workerType ?? assignment.workerType;

      await this.assertTemplatesCompatibleWithWorkerType({
        templates: updateAssignmentDto.templates,
        workerType: effectiveWorkerType,
      });

      await this.assignmentTemplateRepository.delete({ assignmentId: id });
      await this.assignmentParamsRepository.delete({ assignmentId: id });

      const assignmentTemplateEntities = updateAssignmentDto.templates.map(
        (template) => ({
          assignmentId: id,
          templateId: template.templateId,
        }),
      );

      const assignmentParamsEntities = updateAssignmentDto.templates.flatMap(
        (template) =>
          template.params.map((param) => ({
            assignmentId: id,
            templateParamsId: param.templateParamId,
            value: param.value,
          })),
      );
      await this.assignmentTemplateRepository.save(assignmentTemplateEntities);
      await this.assignmentParamsRepository.save(assignmentParamsEntities);
    }

    const updated = await this.assignmentRepository.findOne({ where: { id } });
    if (!updated) return updated;
    return await this.attachBoilerplate(updated);
  }

  async remove(id: number) {
    const assignmentExists = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignmentExists)
      throw new NotFoundException('Assignment não encontrado!');

    this.assertTeacherOwnsAssignment(assignmentExists);

    const attemptCount = await this.attemptRepository.count({
      where: { assignmentId: id },
    });
    if (attemptCount > 0) {
      throw new ConflictException(
        'Não é possível excluir esta tarefa porque existem tentativas de estudantes registradas.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.delete(AssignmentTemplate, { assignmentId: id });
      await manager.delete(AssignmentParam, { assignmentId: id });
      return manager.delete(Assignment, { id });
    });
  }

  async getAssignmentTemplates(assignment: Assignment) {
    return assignment.assignmentTemplates.map(
      (templateRelation) => templateRelation.template.content ?? '',
    );
  }
}
