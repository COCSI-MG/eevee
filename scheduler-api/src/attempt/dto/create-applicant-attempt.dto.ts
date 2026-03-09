import { OmitType } from '@nestjs/mapped-types';
import { Attempt } from '../entities/attempt.entity';
import { AttemptStatus } from '../enums/attempt-status.enum';

export class CreateAttemptDto extends OmitType(Attempt, [
  'id',
  'user',
  'userId',
  'assignment',
  'createdAt',
]) {
  fails: number;
  attempt: number;
  isAcceptable: boolean;
  score: number;
  passes: number;
  report: string;
  refinedReport: string | null;
  assignmentId: number;
  status: AttemptStatus;
}
