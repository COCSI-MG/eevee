import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TemplateParamsService } from './template_params.service';
import { CreateTemplateParamDto } from './dto/create-template_param.dto';
import { UpdateTemplateParamDto } from './dto/update-template_param.dto';

@Controller('template-params')
export class TemplateParamsController {
  constructor(private readonly templateParamsService: TemplateParamsService) {}

  @Post()
  create(@Body() createTemplateParamDto: CreateTemplateParamDto) {
    return this.templateParamsService.create(createTemplateParamDto);
  }

  @Get()
  findAll() {
    return this.templateParamsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templateParamsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTemplateParamDto: UpdateTemplateParamDto) {
    return this.templateParamsService.update(+id, updateTemplateParamDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templateParamsService.remove(+id);
  }
}
