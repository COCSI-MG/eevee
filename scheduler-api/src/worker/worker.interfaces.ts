export interface WorkerResponse {
  passes: number;
  failures: number;
  completeTrace: string;
}

export interface WorkerTestFile {
  templateId: number;
  type: import('./enum/worker-type.enum').WorkerType | 'legacy';
  content: string;
}
