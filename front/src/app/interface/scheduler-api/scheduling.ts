export interface Scheduling {
  assignmentId: number;
  applicationFileContent: string;
}

export interface SchedulingResponse {
  userId: number;
  fails: number;
  attempt: number;
  isAcceptable: boolean;
  score: number;
  passes: number;
  report: string;
  assignmentId: number;
}
