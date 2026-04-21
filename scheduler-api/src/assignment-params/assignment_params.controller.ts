import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AssignmentParamsService } from './assignment_params.service';
import { CreateAssignmentParamDto } from './dto/create-assignment_param.dto';
import { UpdateAssignmentParamDto } from './dto/update-assignment_param.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('assignment-params')
@UseGuards(AdminGuard)
export class AssignmentParamsController {
  constructor(private readonly assignmentParamsService: AssignmentParamsService) {}

  @Post()
  create(@Body() createAssignmentParamDto: CreateAssignmentParamDto) {
    return this.assignmentParamsService.create(createAssignmentParamDto);
  }

  @Get()
  findAll() {
    return this.assignmentParamsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentParamsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssignmentParamDto: UpdateAssignmentParamDto) {
    return this.assignmentParamsService.update(+id, updateAssignmentParamDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assignmentParamsService.remove(+id);
  }
}
