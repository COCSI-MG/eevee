import { ClassAssignmentAttemptSummaryDto } from './class-assignment-attempt-summary.dto';

export interface ClassAssignmentSummaryDto {
  id: number;
  title: string;
  description: string;
  startDate: Date | null;
  dueDate: Date | null;
  answerKeyId: number | null;
  answerKeyVisible: boolean;
  currentUserAlertStatus?: {
    suspended: boolean;
  };
  lastAttempt: ClassAssignmentAttemptSummaryDto | null;
  hasAcceptedAttempt: boolean;
}
