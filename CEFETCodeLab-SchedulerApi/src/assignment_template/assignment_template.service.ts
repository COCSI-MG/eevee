import { Injectable } from '@nestjs/common';
import { CreateAssignmentTemplateDto } from './dto/create-assignment_template.dto';
import { UpdateAssignmentTemplateDto } from './dto/update-assignment_template.dto';

@Injectable()
export class AssignmentTemplateService {
  create(createAssignmentTemplateDto: CreateAssignmentTemplateDto) {
    return 'This action adds a new assignmentTemplate';
  }

  findAll() {
    return `This action returns all assignmentTemplate`;
  }

  findOne(id: number) {
    return `This action returns a #${id} assignmentTemplate`;
  }

  update(id: number, updateAssignmentTemplateDto: UpdateAssignmentTemplateDto) {
    return `This action updates a #${id} assignmentTemplate`;
  }

  remove(id: number) {
    return `This action removes a #${id} assignmentTemplate`;
  }
}
