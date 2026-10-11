import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Template } from './entities/template.entity';
import { Brackets, In, Repository } from 'typeorm';
import { TemplateParam } from 'src/template/entities/template-param.entity';
import { AssignmentTemplate } from 'src/assignment/entities/assignment-template.entity';
import { TemplateParamType } from 'src/template/enums/template-param-type.enum';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { ListTemplatesQueryDto } from './dto/list-templates.query.dto';
import {
  PaginatedResult,
  buildPaginationMeta,
  buildPaginationParams,
} from 'src/common/pagination/pagination';
import { ClassAccessService } from 'src/auth/class-access.service';
import { UserRole } from 'src/user/user-role';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(TemplateParam)
    private readonly templateParamsRepository: Repository<TemplateParam>,
    @InjectRepository(AssignmentTemplate)
    private readonly assignmentTemplateRepository: Repository<AssignmentTemplate>,
    private readonly classAccess: ClassAccessService
  ) {}

  async create(createTemplateDto: CreateTemplateDto) {
    await this.classAccess.assertTeacherAssignment(createTemplateDto.classId);

    const newTemplate = await this.templateRepository.save({
      title: createTemplateDto.title,
      description: createTemplateDto.description,
      filePath: null,
      content: createTemplateDto.content,
      workerType: createTemplateDto.workerType,
      dependencies: createTemplateDto.dependencies ?? [],
      classId: createTemplateDto.classId
    });

    const typedParams = createTemplateDto.typedParams ?? [];
    const params = createTemplateDto.params ?? [];
    const typedParamMap = new Map(
      typedParams.map((p) => [p.name, p.type] as const),
    );

    const templateParamsEntity = params.map((param) => ({
      name: param,
      templateId: newTemplate.id,
      type: typedParamMap.get(param) ?? TemplateParamType.STRING,
    }));

    await this.templateParamsRepository.save(templateParamsEntity);

    return this.findOne(newTemplate.id);
  }

  async findAll(workerType?: WorkerType, classId?: number) {
    const user = this.classAccess.user();

    const qb = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.templateParams', 'templateParams');

    if (!this.classAccess.isAdmin()) qb.innerJoin('template.class', 'class', 'class.teacherId = :teacherId', { teacherId: user.userId });

    if (workerType) qb.andWhere('template.workerType = :workerType', { workerType });

    if (classId != null) {
      await this.classAccess.assertTeacherAssignment(classId);
      qb.andWhere('template.classId = :classId', { classId });
    }

    const templates = await qb.getMany();
    return templates;
  }

  async findAllPaginated(
    query: ListTemplatesQueryDto,
  ): Promise<PaginatedResult<Template>> {
    const { page, pageSize, skip } = buildPaginationParams(query);

    const qb = this.templateRepository
      .createQueryBuilder('template')
      .orderBy('template.id', 'DESC');

    const user = this.classAccess.user();

    if (!this.classAccess.isAdmin()) {
      qb.innerJoin('template.class', 'class', 'class.teacherId = :teacherId', { teacherId: user.userId });
    }

    if (query.workerType) {
      qb.andWhere('template.workerType = :workerType', {
        workerType: query.workerType,
      });
    }

    const search = query.search?.trim();
    if (search) {
      qb.andWhere(
        new Brackets((expr) => {
          expr
            .where('LOWER(template.title) LIKE LOWER(:search)', {
              search: `%${search}%`,
            })
            .orWhere('LOWER(template.description) LIKE LOWER(:search)', {
              search: `%${search}%`,
            })
            .orWhere(
              'LOWER(CAST(template.workerType AS TEXT)) LIKE LOWER(:search)',
              {
                search: `%${search}%`
              }
            );
        }),
      );
    }

    const [data, total] = await qb.clone().skip(skip).take(pageSize).getManyAndCount();

    return { data, meta: buildPaginationMeta(total, page, pageSize) };
  }

  async findOne(id: number) {
    await this.classAccess.assertTemplateAccess(id, true);

    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    return template;
  }

  async update(id: number, updateTemplateDto: UpdateTemplateDto) {
    const { params, typedParams, ...dataToUpdate } = updateTemplateDto;
    const template = await this.classAccess.assertTemplateAccess(id, true);

    if (!template) {
      throw new NotFoundException('Template não encontrado.');
    }

    const requestedClassId = (dataToUpdate as Partial<Template>).classId;

    delete (dataToUpdate as Partial<Template>).classId;

    if (requestedClassId !== undefined && requestedClassId !== template.classId) {

      if (template.classId != null || !this.classAccess.isAdmin() || requestedClassId == null) {
        throw new BadRequestException('A template cannot be moved to another class.');
      }

      await this.classAccess.assertClassAccess(requestedClassId, true);
      await this.templateRepository.update(id, { classId: requestedClassId });
      template.classId = requestedClassId;
    }

    await this.templateRepository.update(id, dataToUpdate);

    if (params || typedParams) {
      const existingParams = await this.templateParamsRepository.find({
        where: { templateId: id },
      });

      const existingNames = existingParams.map((p) => p.name);

      const incomingNames = params ?? existingNames;

      const removedParams = existingNames.filter(
        (name) => !incomingNames.includes(name),
      );

      if (removedParams.length) {
        const isTemplateAssociatedToAssignment =
          await this.assignmentTemplateRepository.findOne({
            where: { templateId: id },
          });

        if (isTemplateAssociatedToAssignment) {
          throw new BadRequestException(
            'Não é permitido remover parâmetros de um template já associado a um assignment.',
          );
        }

        await this.templateParamsRepository.delete({
          templateId: id,
          name: In(removedParams),
        });
      }

      const incomingTypedParams = typedParams ?? [];
      const incomingTypeMap = new Map(
        incomingTypedParams.map((p) => [p.name, p.type] as const),
      );

      const newParams = incomingNames
        .filter((name) => !existingNames.includes(name))
        .map((name) => ({
          name,
          templateId: id,
          type: incomingTypeMap.get(name) ?? TemplateParamType.STRING,
        }));

      if (newParams.length) {
        await this.templateParamsRepository.save(newParams);
      }

      if (incomingTypedParams.length) {
        const existingByName = new Map(existingParams.map((p) => [p.name, p]));
        const updates = incomingTypedParams
          .map((p) => {
            const existing = existingByName.get(p.name);
            if (!existing) return null;
            return {
              id: existing.id,
              type: p.type,
            };
          })
          .filter(
            (u): u is { id: number; type: TemplateParamType } => u !== null,
          );

        if (updates.length) {
          await this.templateParamsRepository.save(updates);
        }
      }
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.classAccess.assertTemplateAccess(id, true);

    const isTemplateAssociatedToAssignment =
      await this.assignmentTemplateRepository.findOne({
        where: { templateId: id },
      });

    if (isTemplateAssociatedToAssignment) {
      throw new ConflictException(
        'O template está associado a um assignment e não pode ser excluído.',
      );
    }

    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    return await this.templateRepository.delete({ id });
  }
}
