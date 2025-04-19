import { Injectable } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Template } from './entities/template.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { TemplateParam } from 'src/template_params/entities/template_param.entity';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(TemplateParam)
    private readonly templateParamsRepository: Repository<TemplateParam>,
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

  findAll() {
    return this.templateRepository.find();
  }

  findOne(id: number) {
    return this.templateRepository.findOne({
      where: { id },
    });
  }

  // Acredito que o arquivo deverá ser substituido
  update(id: number, updateTemplateDto: UpdateTemplateDto) {
    return this.templateRepository.update(id, updateTemplateDto);
  }

  // Implementar regra de não deixar excluir se estiver sendo usado em uma tarefa
  remove(id: number) {
    return this.templateRepository.delete({ id });
  }
}
