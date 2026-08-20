import { Injectable } from '@nestjs/common';
import { CreateAssignmentParamDto } from './dto/create-assignment-param.dto';
import { UpdateAssignmentParamDto } from './dto/update-assignment-param.dto';

@Injectable()
export class AssignmentParamsService {
  create(createAssignmentParamDto: CreateAssignmentParamDto) {
    return 'This action adds a new assignmentParam';
  }

  findAll() {
    return `This action returns all assignmentParams`;
  }

  findOne(id: number) {
    return `This action returns a #${id} assignmentParam`;
  }

  update(id: number, updateAssignmentParamDto: UpdateAssignmentParamDto) {
    return `This action updates a #${id} assignmentParam`;
  }

  remove(id: number) {
    return `This action removes a #${id} assignmentParam`;
  }
}
