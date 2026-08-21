import { PartialType } from '@nestjs/mapped-types';
import { CreateAttemptDto } from './create-applicant-attempt.dto';

export class UpdateApplicantAttemptDto extends PartialType(CreateAttemptDto) {
  id: number;
}
