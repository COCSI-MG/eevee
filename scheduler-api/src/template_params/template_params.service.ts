import { Injectable } from '@nestjs/common';
import { CreateTemplateParamDto } from './dto/create-template_param.dto';
import { UpdateTemplateParamDto } from './dto/update-template_param.dto';

@Injectable()
export class TemplateParamsService {
  create(createTemplateParamDto: CreateTemplateParamDto) {
    return 'This action adds a new templateParam';
  }

  findAll() {
    return `This action returns all templateParams`;
  }

  findOne(id: number) {
    return `This action returns a #${id} templateParam`;
  }

  update(id: number, updateTemplateParamDto: UpdateTemplateParamDto) {
    return `This action updates a #${id} templateParam`;
  }

  remove(id: number) {
    return `This action removes a #${id} templateParam`;
  }
}
