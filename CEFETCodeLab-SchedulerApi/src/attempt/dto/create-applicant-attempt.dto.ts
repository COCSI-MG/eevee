import { Attempt } from '../entities/attempt.entity';

export class CreateAttemptDto
  implements
    Omit<Omit<Omit<Omit<Attempt, 'id'>, 'user'>, 'assignment'>, 'userId'>
{
  fails: number;
  attempt: number;
  isAcceptable: boolean;
  score: number;
  passes: number;
  report: string;
  assignmentId: number;
}
