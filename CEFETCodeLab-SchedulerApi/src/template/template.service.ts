import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Template } from './entities/template.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { TemplateParam } from 'src/template_params/entities/template_param.entity';
import { AssignmentTemplate } from 'src/assignment_template/entities/assignment_template.entity';

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

  async create(createTemplateDto: CreateTemplateDto) {
    const { title, templateContent }  = createTemplateDto;
    const templatesDir = path.join(process.cwd(), 'templates-upload');

    const safeName = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_${Date.now()}.tpl.txt`;
    const fullPath = path.join(templatesDir, filename);
    fs.writeFileSync(fullPath, templateContent, 'utf-8');

    const newTemplate = await this.templateRepository.save({ ...createTemplateDto, filePath: filename});

    const templateParamsEntity = createTemplateDto.params.map(param => ({
      name: param,
      templateId: newTemplate.id
    }))

    await this.templateParamsRepository.save(templateParamsEntity);

  }

  async findAll() {
    const templates = await this.templateRepository.find();
    return templates.map(template => {
      const filePath = path.join(process.cwd(), 'templates-upload', template.filePath);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return {
          ...template,
          templateContent: content,
        }
      } catch (error) {
        console.error('Erro ao ler o arquivo do template:', error);
      }
    })
  }

  async findOne(id: number) {
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    const filePath = path.join(process.cwd(), 'templates-upload', template.filePath);

    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return {
        ...template,
        templateContent: content,
      };
    } catch (error) {
      console.error('Erro ao ler o arquivo do template:', error);
      throw new Error('Erro ao carregar o conteúdo do template');
    }
}

  async update(id: number, updateTemplateDto: UpdateTemplateDto) {
    const { templateContent, params, ...dataToUpdate } = updateTemplateDto;
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
      filePath: newFilePath
    });

    if (params) {
      await this.templateParamsRepository.delete({ templateId: id });

      const newParams = params.map((param) => ({
        name: param,
        templateId: id,
      }));

      await this.templateParamsRepository.save(newParams);
    }
  }

  async remove(id: number) {
    const isTemplateAssociatedToAssignment = await this.assignmentTemplateRepository.findOne({where: { templateId: id } })

    if (isTemplateAssociatedToAssignment) {
      throw new ConflictException('O template está associado a um assignment e não pode ser excluído.');
    }

    return this.templateRepository.delete({ id });
  }
}
