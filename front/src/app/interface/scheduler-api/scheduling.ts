export type SchedulingFiles = Record<string, string>;

export interface Scheduling {
  assignmentId: number;
  applicationFileContent: string | undefined;
  files: SchedulingFiles;
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
