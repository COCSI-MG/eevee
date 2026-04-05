import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { RequestContextService } from 'src/request-context/request-context.service';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { ClassService } from 'src/class/class.service';
import { AssignmentTemplate } from 'src/assignment_template/entities/assignment_template.entity';
import { AssignmentParam } from 'src/assignment_params/entities/assignment_param.entity';
import { Template } from 'src/template/entities/template.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { readFileAsString } from 'src/utils/template.utils';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class AssignmentService {
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
  }): Promise<void> {
    const templateIds = options.templates.map((t) => t.templateId);
    if (!templateIds.length) return;

    const found = await this.templateRepository.find({
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

  private getBoilerplatesDirAbsolutePath(): string {
    return path.join(process.cwd(), 'assignments-upload', 'boilerplates');
  }

  private async writeBoilerplateFile(
    assignmentId: number,
    content: string,
  ): Promise<string> {
    const boilerplatesDir = this.getBoilerplatesDirAbsolutePath();
    await fs.mkdir(boilerplatesDir, { recursive: true });

    const fileName = `assignment_${assignmentId}.boilerplate.ts`;
    const absolutePath = path.join(boilerplatesDir, fileName);
    await fs.writeFile(absolutePath, content ?? '', 'utf-8');

    // Store as a stable, portable relative path (POSIX-style)
    return `boilerplates/${fileName}`;
  }

  private async readBoilerplateFileContent(
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

  private async attachBoilerplate(assignment: Assignment) {
    const boilerplate = await this.readBoilerplateFileContent(
      assignment.boilerplateFilePath,
    );

    return {
      ...assignment,
      // Preferred name
      boilerplate,
      // Backward compatible alias for older frontends
      validationScript: boilerplate,
    };
  }

  private getTeacherVisibilityWhere(): any[] | undefined {
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

  async create(createAssignmentDto: CreateAssignmentDto) {
    const { templates, boilerplate, validationScript, ...assignmentData } =
      createAssignmentDto;

    const classExists = await this.classservice.findOne(
      createAssignmentDto.classId,
    );

    if (!classExists) {
      throw new NotFoundException(
        `Class with id ${createAssignmentDto.classId} not found`,
      );
    }

    const user = this.requestContextService.getUser();

    const newAssignment = await this.assignmentRepository.save({
      classId: assignmentData.classId,
      title: assignmentData.title,
      description: assignmentData.description,
      maxAttempts: assignmentData.maxAttempts,
      workerType: assignmentData.workerType,
      initSqlScript: assignmentData.initSqlScript,
      createdById: user?.userId,
    });

    const resolvedBoilerplate =
      typeof boilerplate === 'string'
        ? boilerplate
        : typeof validationScript === 'string'
          ? validationScript
          : undefined;

    if (typeof resolvedBoilerplate === 'string') {
      const boilerplateFilePath = await this.writeBoilerplateFile(
        newAssignment.id,
        resolvedBoilerplate,
      );

      await this.assignmentRepository.update(newAssignment.id, {
        boilerplateFilePath,
      });

      newAssignment.boilerplateFilePath = boilerplateFilePath;
    }

    if (templates && templates.length > 0) {
      await this.assertTemplatesCompatibleWithWorkerType({
        templates,
        workerType: assignmentData.workerType,
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

      await this.assignmentTemplateRepository.save(assignmentTemplateEntities);
      await this.assignmentParamsRepository.save(assignmentParamsEntities);
    }

    return await this.attachBoilerplate(newAssignment);
  }

  findAllUserAssignments() {
    const user = this.requestContextService.getUser();

    return this.assignmentRepository.find({
      relations: [
        'assignmentAttempts',
        'class',
        'class.userClasses',
        'class.userClasses.user',
        'suspensions',
      ],
      where: {
        class: {
          userClasses: {
            userId: user.userId,
          },
        },
      },
    });
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

  async findAssignmentsByClass(classId: number) {
    const user = this.requestContextService.getUser();

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

    const assignments = await this.assignmentRepository.find({
      relations: ['assignmentAttempts', 'suspensions'],
      where: user.isAdmin
        ? [
            { classId, createdById: user.userId },
            { classId, createdById: IsNull() },
          ]
        : { classId },
    });

    return await Promise.all(assignments.map((a) => this.attachBoilerplate(a)));
  }

  async findOne(id: number) {
    const user = this.requestContextService.getUser();

    let where: any = {
      id,
      class: {
        userClasses: { userId: user.userId },
      },
    };

    // Students can access assignments through class membership.
    // Teachers (isAdmin) are restricted to assignments they created.
    if (user.isAdmin) {
      // Teachers can see their own assignments, plus legacy ones (createdById IS NULL).
      where = [
        { id, createdById: user.userId },
        { id, createdById: IsNull() },
      ];
    }

    const response = await this.assignmentRepository.findOne({
      relations: [
        'assignmentAttempts',
        'class',
        'class.userClasses',
        'assignmentParams',
        'assignmentTemplates',
        'assignmentTemplates.template',
        'assignmentTemplates.template.templateParams',
        'suspensions',
      ],
      where,
      order: {
        assignmentAttempts: {
          createdAt: 'DESC',
        },
      },
    });

    if (!response) return response;
    return await this.attachBoilerplate(response);
  }

  async update(id: number, updateAssignmentDto: UpdateAssignmentDto) {
    const { templates, boilerplate, validationScript, ...dataToUpdate } =
      updateAssignmentDto;

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

    const resolvedBoilerplate =
      typeof boilerplate === 'string'
        ? boilerplate
        : typeof validationScript === 'string'
          ? validationScript
          : undefined;

    if (typeof resolvedBoilerplate === 'string') {
      const boilerplateFilePath = await this.writeBoilerplateFile(
        assignment.id,
        resolvedBoilerplate,
      );

      await this.assignmentRepository.update(assignment.id, {
        boilerplateFilePath,
      });

      assignment.boilerplateFilePath = boilerplateFilePath;
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
    return Promise.all(
      assignment.assignmentTemplates.map(async (templateRelation) => {
        return await readFileAsString(templateRelation.template.filePath);
      }),
    );
  }
}
