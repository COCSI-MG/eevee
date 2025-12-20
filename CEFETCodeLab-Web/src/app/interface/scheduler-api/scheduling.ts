export interface SchedulingFilesNode {
  id: string;
  type: 'file' | 'folder';
  children?: SchedulingFilesNode[] | null;
  content?: string;
}

export interface Scheduling {
  assignmentId: number;
  applicationFileContent: string;
  files: SchedulingFilesNode | null; 
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
