export type WorkerJobPayload = {
  files: Record<string, string> | null;
  testFiles: Record<string, string> | null;
  srcPath: string;
  testPath: string;
  dependencies: string[];
};