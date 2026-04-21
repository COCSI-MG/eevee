import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AssignmentTemplateService } from './assignment_template.service';
import { CreateAssignmentTemplateDto } from './dto/create-assignment_template.dto';
import { UpdateAssignmentTemplateDto } from './dto/update-assignment_template.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('assignment-template')
@UseGuards(AdminGuard)
export class AssignmentTemplateController {
  constructor(private readonly assignmentTemplateService: AssignmentTemplateService) {}

  @Post()
  create(@Body() createAssignmentTemplateDto: CreateAssignmentTemplateDto) {
    return this.assignmentTemplateService.create(createAssignmentTemplateDto);
  }

  @Get()
  findAll() {
    return this.assignmentTemplateService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentTemplateService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssignmentTemplateDto: UpdateAssignmentTemplateDto) {
    return this.assignmentTemplateService.update(+id, updateAssignmentTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assignmentTemplateService.remove(+id);
  }
}
