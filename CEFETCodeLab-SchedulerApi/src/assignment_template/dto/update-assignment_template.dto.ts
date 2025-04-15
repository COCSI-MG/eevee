import { PartialType } from '@nestjs/swagger';
import { CreateAssignmentTemplateDto } from './create-assignment_template.dto';

export class UpdateAssignmentTemplateDto extends PartialType(CreateAssignmentTemplateDto) {}
