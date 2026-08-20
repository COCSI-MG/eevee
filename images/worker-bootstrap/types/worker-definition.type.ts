export type WorkerDefinition = {
  testPath: string;
  srcPath: string;
  files: Record<string, string> | null;
  testFiles: Record<string, string> | null;
  dependencies: string[];
};