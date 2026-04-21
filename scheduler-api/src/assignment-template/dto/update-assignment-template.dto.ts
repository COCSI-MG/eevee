import { PartialType } from '@nestjs/swagger';
import { CreateAssignmentTemplateDto } from './create-assignment-template.dto';

export class UpdateAssignmentTemplateDto extends PartialType(CreateAssignmentTemplateDto) {}
