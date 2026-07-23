import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateExamDto } from './create-exam.dto';

export class UpdateExamDto extends PartialType(
  OmitType(CreateExamDto, ['classId'] as const),
) {
  override startDate?: string | null;
}
