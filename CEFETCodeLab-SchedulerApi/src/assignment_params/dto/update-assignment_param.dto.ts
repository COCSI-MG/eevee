import { PartialType } from '@nestjs/swagger';
import { CreateAssignmentParamDto } from './create-assignment_param.dto';

export class UpdateAssignmentParamDto extends PartialType(CreateAssignmentParamDto) {}
