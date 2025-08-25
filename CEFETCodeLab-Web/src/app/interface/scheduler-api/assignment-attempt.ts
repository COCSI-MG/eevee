export interface AssignmentAttempt {
  id: number;
  attempt: number;
  userId: number;
  assignmentId: number;
  isAcceptable: boolean;
  score: number;
  passes: number;
  fails: number;
  report: string;
  status: string;
}
