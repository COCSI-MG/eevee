import { PartialType } from '@nestjs/swagger';
import { CreateAssignmentUserSuspensionDto } from './create-assignment-user-suspension.dto';

export class UpdateAssignmentUserSuspensionDto extends PartialType(CreateAssignmentUserSuspensionDto) {}
