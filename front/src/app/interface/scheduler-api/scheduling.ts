export type SchedulingFiles = Record<string, string>;

export interface Scheduling {
  assignmentId: number;
  applicationFileContent: string | undefined;
  files: SchedulingFiles;
}

export interface SchedulingResponse {
  assignmentId: number;
  isAcceptable: boolean;
  score: number;
  passes: number;
  fails: number;
  report: string;
}
