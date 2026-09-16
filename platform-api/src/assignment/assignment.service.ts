import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AssignmentTemplateDto,
  CreateAssignmentDto,
} from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import {
  Brackets,
  DataSource,
  EntityManager,
  In,
  IsNull,
  Not,
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

  private normalizeTemplateWeights(templates: AssignmentTemplateDto[]): number[] {
    if (templates.length === 0) return [];

    this.assertWeightsInRange(templates);

    const cents = templates.map((t) =>
      t.weight != null ? this.toCents(t.weight) : null,
    );

    if (cents.every((c) => c === null)) {
      return this.splitEvenlyAcross(templates.length);
    }

    const { explicitIndices, missingIndices } = this.partitionByPresence(cents);

    if (missingIndices.length === 0) {
      return this.assertSumIsExactly100(cents);
    }

    return this.distributeRemainder(cents, explicitIndices, missingIndices);
  }

  /** Converts a decimal weight (e.g. 33.33) to its cent representation (e.g. 3333). */
  private toCents(weight: number): number {
    return Math.round(weight * 100);
  }

  /** Formats a cent value as a human-readable percent string without trailing zeros (e.g. 9999 → "99.99", 10000 → "100"). */
  private formatPercentForError(totalCents: number): string {
    return (totalCents / 100).toFixed(2).replace(/\.?0+$/, '') || '0';
  }

  /** Validates that every explicit weight is within [0, 100]. */
  private assertWeightsInRange(templates: AssignmentTemplateDto[]): void {
    for (const t of templates) {
      if (t.weight != null && (t.weight < 0 || t.weight > 100)) {
        throw new BadRequestException(
          `Template weight must be between 0 and 100, got ${t.weight}`,
        );
      }
    }
  }

  /**
   * Partitions the cents array into indices that have explicit values and those that are null.
   * Indices with explicit values may also include zero (weight = 0).
   */
  private partitionByPresence(cents: (number | null)[]): {
    explicitIndices: number[];
    missingIndices: number[];
  } {
    const explicitIndices: number[] = [];
    const missingIndices: number[] = [];
    for (let i = 0; i < cents.length; i++) {
      (cents[i] !== null ? explicitIndices : missingIndices).push(i);
    }
    return { explicitIndices, missingIndices };
  }

  /**
   * Case A — All weights missing. Splits 100% evenly across N templates,
   * using Math.floor and concentrating the rounding residual on the last one.
   */
  private splitEvenlyAcross(n: number): number[] {
    const base = Math.floor(10000 / n);
    const result = new Array<number>(n).fill(base);
    result[n - 1] += 10000 - base * n;
    return result.map((c) => c / 100);
  }

  /**
   * Case C — All weights explicit. Asserts they sum to exactly 100%,
   * otherwise throws BadRequestException with the current sum.
   */
  private assertSumIsExactly100(cents: (number | null)[]): number[] {
    const total = cents.reduce<number>((s, c) => s + (c as number), 0);
    if (total !== 10000) {
      throw new BadRequestException(
        `Template weights must sum to 100%, got ${this.formatPercentForError(total)}%`,
      );
    }
    return cents.map((c) => (c as number) / 100);
  }

  /**
   * Cases B & D — Some weights explicit, some missing.
   * Computes the remainder (10000 − sum of explicit cents), throws if negative,
   * then distributes the remainder as evenly as possible across the missing slots
   * using Math.floor and concentrating the rounding residual on the last missing slot.
   */
  private distributeRemainder(
    cents: (number | null)[],
    explicitIndices: number[],
    missingIndices: number[],
  ): number[] {
    const explicitTotal = explicitIndices.reduce<number>(
      (s, i) => s + (cents[i] as number),
      0,
    );
    const remainder = 10000 - explicitTotal;
    if (remainder < 0) {
      throw new BadRequestException(
        `Template weights must sum to 100%, got ${this.formatPercentForError(explicitTotal)}%`,
      );
    }
    const nMissing = missingIndices.length;
    const base = Math.floor(remainder / nMissing);
    for (let k = 0; k < nMissing; k++) {
      cents[missingIndices[k]] = base;
    }
    const lastIdx = missingIndices[nMissing - 1];
    cents[lastIdx] = (cents[lastIdx] as number) + (remainder - base * nMissing);
    return cents.map((c) => (c as number) / 100);
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

  private parseOptionalDate(
    value: string | null | undefined,
  ): Date | null | undefined {
    if (value === undefined) return undefined;

    if (value === null) return null;

    return new Date(value);
  }

  private assertValidDateRange(
    startDate: Date | null | undefined,
    dueDate: Date | null | undefined,
  ): void {
    if (startDate && dueDate && startDate > dueDate) {
      throw new BadRequestException('startDate must not be after dueDate');
    }
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
      startDate: startDateValue,
      dueDate: dueDateValue,
      ...assignmentData
    } = createAssignmentDto;

    const startDate = this.parseOptionalDate(startDateValue) ?? null;
    const dueDate = this.parseOptionalDate(dueDateValue) ?? null;
    this.assertValidDateRange(startDate, dueDate);

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
      startDate,
      dueDate,
      allowCopyPaste: assignmentData.allowCopyPaste ?? false,
      workerType: assignmentData.workerType,
      executionMode: assignmentData.executionMode,
      initSqlScript: assignmentData.initSqlScript,
      boilerplateContent: resolvedBoilerplateContent,
      allowProjectImport: assignmentData.allowProjectImport ?? false,
      createdById: user?.userId,
    });

    if (templates && templates.length > 0) {
      await this.assertTemplatesCompatibleWithWorkerType({
        templates,
        workerType: assignmentData.workerType,
        templateRepo,
      });

      const weights = this.normalizeTemplateWeights(templates);

      const assignmentTemplateEntities = templates.map((template, i) => ({
        assignmentId: newAssignment.id,
        templateId: template.templateId,
        weight: weights[i],
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

    if (user.isAdmin) {
      return this.findAll();
    }

    const now = new Date();
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

    query
      .leftJoinAndSelect(
        'assignment.examAssignment',
        'visibilityExamAssignment'
      )
      .leftJoinAndSelect('visibilityExamAssignment.exam', 'visibilityExam')
      .andWhere(
        '(assignment.startDate IS NULL OR assignment.startDate <= :assignmentNow)',
        { assignmentNow: now }
      )
      .andWhere(
        '(visibilityExamAssignment.id IS NULL OR (visibilityExam.startDate IS NOT NULL AND visibilityExam.startDate <= :examNow))',
        { examNow: now }
      );

    const assignments = await query.getMany();

    this.logger.debug(assignments, 'Assignments fetched for user');

    return Promise.all(assignments.map((a) => this.attachBoilerplate(a)));
  }

  findAll() {
    return this.assignmentRepository
      .find({
        relations: [
          'assignmentAttempts',
          'class',
          'class.userClasses',
          'suspensions',
        ],
      })
      .then((assignments) =>
        Promise.all(assignments.map((a) => this.attachBoilerplate(a))),
      );
  }

  findOptions(classId?: number) {
    return this.assignmentRepository.find({
      select: {
        id: true,
        title: true,
        classId: true
      },
      ...(classId ? { where: { classId } } : {}),
      order: {
        id: 'ASC',
        title: 'ASC'
      },
    });
  }

  async findAllPaginated(
    query: ListAssignmentsQueryDto,
  ): Promise<PaginatedResult<Assignment>> {
    const { page, pageSize, skip } = buildPaginationParams(query);

    const qb = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.assignmentAttempts', 'assignmentAttempts')
      .leftJoinAndSelect('assignment.class', 'class')
      .leftJoinAndSelect('class.userClasses', 'userClasses')
      .leftJoinAndSelect('assignment.suspensions', 'suspensions')
      .leftJoin('assignment.examAssignment', 'examAssignment')
      .orderBy('assignment.id', 'DESC');

    if (query.classId) {
      qb.andWhere('assignment.classId = :classId', {
        classId: query.classId
      });
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
            .orWhere(
              'LOWER(CAST(assignment.workerType AS TEXT)) LIKE LOWER(:search)',
              {
                search: `%${search}%`
              }
            );
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

  async findAssignmentsByClass(classId: number) {
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
      .leftJoin('assignment.examAssignment', 'examAssignment')
      .where('assignment.classId = :classId', { classId })
      .andWhere('examAssignment.id IS NULL');

    if (!user.isAdmin) {
      query.andWhere(
        '(assignment.startDate IS NULL OR assignment.startDate <= :now)',
        { now: new Date() }
      );
    }

    const assignments = await query.getMany();

    return Promise.all(assignments.map((a) => this.attachBoilerplate(a)));
  }

  private createAssignmentDetailsQuery(id: number) {
    return this.assignmentRepository
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
      .where('assignment.id = :id', { id });
  }

  async findOne(id: number) {
    const user = this.requestContextService.getUser();
    const now = new Date();

    const query = this.createAssignmentDetailsQuery(id)
      .leftJoinAndSelect('assignment.examAssignment', 'detailsExamAssignment')
      .leftJoinAndSelect('detailsExamAssignment.exam', 'detailsExam')
      .orderBy('assignmentAttempts.createdAt', 'DESC');

    if (user.isAdmin) {
      query
        .leftJoinAndSelect('class.userClasses', 'userClasses')
        .leftJoinAndSelect(
          'assignment.assignmentAttempts',
          'assignmentAttempts',
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
        )
        .andWhere(
          '(assignment.startDate IS NULL OR assignment.startDate <= :assignmentNow)',
          { assignmentNow: now }
        )
        .andWhere(
          '(detailsExamAssignment.id IS NULL OR (detailsExam.startDate IS NOT NULL AND detailsExam.startDate <= :examNow))',
          { examNow: now }
        );
    }

    const response = await query.getOne();
    if (!response) {
      throw new NotFoundException('Assignment not found');
    }

    return await this.attachBoilerplate(response);
  }

  async findOneForExecution(id: number) {
    const assignment = await this.createAssignmentDetailsQuery(id).getOne();

    if (!assignment) {
      return null;
    }

    return await this.attachBoilerplate(assignment);
  }

  async assertSubmissionOpen(assignmentId: number): Promise<void> {
    const user = this.requestContextService.getUser();
    if (user?.isAdmin) return;

    const window = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.examAssignment', 'submissionExamAssignment')
      .leftJoin('submissionExamAssignment.exam', 'submissionExam')
      .select('assignment.dueDate', 'assignmentDueDate')
      .addSelect('submissionExam.dueDate', 'examDueDate')
      .where('assignment.id = :assignmentId', { assignmentId })
      .getRawOne<{
        assignmentDueDate: Date | string | null;
        examDueDate: Date | string | null;
      }>();

    if (!window) {
      throw new NotFoundException('Assignment not found');
    }

    const now = new Date();
    const deadlines = [window.assignmentDueDate, window.examDueDate]
      .filter((value): value is Date | string => value != null)
      .map((value) => new Date(value));

    if (deadlines.some((deadline) => now > deadline)) {
      throw new UnprocessableEntityException(
        'Prazo de entrega da tarefa encerrado.',
      );
    }
  }

  async update(id: number, updateAssignmentDto: UpdateAssignmentDto) {
    const {
      templates,
      boilerplateContent,
      boilerplate,
      validationScript,
      startDate: startDateValue,
      dueDate: dueDateValue,
      ...assignmentDataToUpdate
    } = updateAssignmentDto;

    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    const parsedStartDate = this.parseOptionalDate(startDateValue);
    const parsedDueDate = this.parseOptionalDate(dueDateValue);

    const effectiveStartDate = parsedStartDate !== undefined ? parsedStartDate : assignment.startDate;
    const effectiveDueDate   = parsedDueDate   !== undefined ? parsedDueDate : assignment.dueDate;

    this.assertValidDateRange(effectiveStartDate, effectiveDueDate);

    const dataToUpdate: Partial<Assignment> = {
      ...assignmentDataToUpdate,
    };
    if (parsedStartDate !== undefined) {
      dataToUpdate.startDate = parsedStartDate;
    }
    if (parsedDueDate !== undefined) {
      dataToUpdate.dueDate = parsedDueDate;
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
        dataToUpdate.workerType ?? assignment.workerType;

      await this.assertTemplatesCompatibleWithWorkerType({
        templates: updateAssignmentDto.templates,
        workerType: effectiveWorkerType,
      });

      const weights = this.normalizeTemplateWeights(
        updateAssignmentDto.templates,
      );

      await this.assignmentTemplateRepository.delete({ assignmentId: id });
      await this.assignmentParamsRepository.delete({ assignmentId: id });

      const assignmentTemplateEntities = updateAssignmentDto.templates.map(
        (template, i) => ({
          assignmentId: id,
          templateId: template.templateId,
          weight: weights[i],
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

  async findImportSources(destinationAssignmentId: number) {
    const destination = await this.findOne(destinationAssignmentId);
    this.assertProjectImportAllowed(destination);

    const user = this.requestContextService.getUser();

    const rows = await this.assignmentRepository
      .createQueryBuilder('source')
      .innerJoin(
        'source.assignmentAttempts',
        'attempt',
        'attempt.userId = :userId AND attempt.receivedWork IS NOT NULL',
        { userId: user.userId }
      )
      .select('source.id', 'id')
      .addSelect('source.title', 'title')
      .addSelect('MAX(attempt.createdAt)', 'submittedAt')
      .where('source.classId = :classId', { classId: destination.classId })
      .andWhere('source.workerType = :workerType', { workerType: destination.workerType })
      .andWhere('source.id != :destinationAssignmentId', { destinationAssignmentId })
      .groupBy('source.id')
      .addGroupBy('source.title')
      .orderBy('LOWER(source.title)', 'ASC')
      .addOrderBy('source.id', 'ASC')
      .getRawMany<{ id: string; title: string; submittedAt: Date }>()

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      submittedAt: row.submittedAt
    }))
  }

  async findImportSource(
    destinationAssignmentId: number,
    sourceAssignmentId: number,
  ) {
    const destination = await this.findOne(destinationAssignmentId);
    this.assertProjectImportAllowed(destination);

    if (sourceAssignmentId === destinationAssignmentId) throw new BadRequestException('The destination assignment cannot be used as an import source.')

    const source = await this.assignmentRepository.findOne({
      where: { id: sourceAssignmentId },
      select: {
        id: true,
        title: true,
        classId: true,
        workerType: true
      }
    });

    if (!source) throw new NotFoundException('Import source not found')

    if (
      source.classId !== destination.classId ||
      source.workerType !== destination.workerType
    ) throw new BadRequestException('The selected assignment does not have a compatible workspace.')

    const user = this.requestContextService.getUser();
    const attempt = await this.attemptRepository.findOne({
      where: {
        assignmentId: sourceAssignmentId,
        userId: user.userId,
        receivedWork: Not(IsNull())
      },
      order: { attempt: 'DESC' }
    })

    if (!attempt?.receivedWork) throw new NotFoundException('Submitted project not found')

    return {
      id: source.id,
      title: source.title,
      submittedAt: attempt.createdAt,
      files: attempt.receivedWork
    }
  }

  private assertProjectImportAllowed(assignment: Assignment): void {
    if (!assignment.allowProjectImport) throw new ForbiddenException('Project import is not allowed for this assignment.')
  }

  async getAssignmentTemplates(assignment: Assignment) {
    return assignment.assignmentTemplates.map(
      (templateRelation) => templateRelation.template.content ?? '',
    );
  }
}
