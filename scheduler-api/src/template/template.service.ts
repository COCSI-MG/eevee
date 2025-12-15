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
import { In, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { TemplateParam } from 'src/template-params/entities/template-param.entity';
import { AssignmentTemplate } from 'src/assignment_template/entities/assignment_template.entity';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { TemplateParamType } from 'src/template-params/enums/template-param-type.enum';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(TemplateParam)
    private readonly templateParamsRepository: Repository<TemplateParam>,
    @InjectRepository(AssignmentTemplate)
    private readonly assignmentTemplateRepository: Repository<AssignmentTemplate>,
  ) {}

  private serializeTemplate(template: Template, templateContent: string) {
    return {
      id: template.id,
      title: template.title,
      description: template.description,
      filePath: template.filePath,
      workerType: template.workerType,
      dependencies: template.dependencies,
      templateParams: template.templateParams,
      templateContent,
    };
  }

  async create(createTemplateDto: CreateTemplateDto) {
    const { title, templateContent } = createTemplateDto;
    const templatesDir = path.join(process.cwd(), 'templates-upload');
    if (!existsSync(templatesDir)) {
      await mkdir(templatesDir, { recursive: true });
    }

    const safeName = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_${Date.now()}.tpl.txt`;
    const fullPath = path.join(templatesDir, filename);
    fs.writeFileSync(fullPath, templateContent, 'utf-8');

    const newTemplate = await this.templateRepository.save({
      title: createTemplateDto.title,
      description: createTemplateDto.description,
      filePath: filename,
      workerType: createTemplateDto.workerType,
      dependencies: createTemplateDto.dependencies ?? [],
    });

    const typedParams = createTemplateDto.typedParams ?? [];
    const typedParamMap = new Map(
      typedParams.map((p) => [p.name, p.type] as const),
    );

    const templateParamsEntity = createTemplateDto.params.map((param) => ({
      name: param,
      templateId: newTemplate.id,
      type: typedParamMap.get(param) ?? TemplateParamType.STRING,
    }));

    await this.templateParamsRepository.save(templateParamsEntity);

    return this.findOne(newTemplate.id);
  }

  async findAll(workerType?: WorkerType) {
    const templates = await this.templateRepository.find({
      ...(workerType ? { where: { workerType } } : {}),
    });
    const hydrated = templates.map((template) => {
      const filePath = path.join(
        process.cwd(),
        'templates-upload',
        template.filePath,
      );
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return this.serializeTemplate(template, content);
      } catch (error) {
        console.error('Erro ao ler o arquivo do template:', error);
        return this.serializeTemplate(template, '');
      }
    });

    return hydrated;
  }

  async findOne(id: number) {
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    const filePath = path.join(
      process.cwd(),
      'templates-upload',
      template.filePath,
    );

    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return this.serializeTemplate(template, content);
    } catch (error) {
      console.error('Erro ao ler o arquivo do template:', error);
      throw new Error('Erro ao carregar o conteúdo do template');
    }
  }

  async update(id: number, updateTemplateDto: UpdateTemplateDto) {
    const { templateContent, params, typedParams, ...dataToUpdate } =
      updateTemplateDto;
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException('Template não encontrado.');
    }

    const templatesDir = path.join(process.cwd(), 'templates-upload');
    let newFilePath = template.filePath;

    if (updateTemplateDto.templateContent) {
      const oldFullPath = path.join(templatesDir, template.filePath);
      if (fs.existsSync(oldFullPath)) {
        fs.unlinkSync(oldFullPath);
      }

      const titleForFilename = updateTemplateDto.title || template.title;
      const safeName = titleForFilename.replace(/[^a-zA-Z0-9_-]/g, '_');
      const newFilename = `${safeName}_${Date.now()}.tpl.txt`;

      const newFullPath = path.join(templatesDir, newFilename);
      fs.writeFileSync(newFullPath, templateContent, 'utf-8');

      newFilePath = newFilename;
    }

    await this.templateRepository.update(id, {
      ...dataToUpdate,
      filePath: newFilePath,
    });

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

    const filePath = path.join(
      process.cwd(),
      'templates-upload',
      template.filePath,
    );

    try {
      await fs.promises.unlink(filePath);
      return await this.templateRepository.delete({ id });
    } catch (error) {
      console.error('Erro ao excluir o arquivo do template:', error);
    }
  }
}
