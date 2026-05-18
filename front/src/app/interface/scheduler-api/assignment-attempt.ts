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
  refinedReport?: string;
  status: string;
  createdAt?: string;
}
