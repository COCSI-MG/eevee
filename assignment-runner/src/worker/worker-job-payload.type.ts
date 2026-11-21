export type WorkerJobPayload = {
  files: Record<string, string> | null;
  testFiles: Record<string, string> | null;
  srcPath: string;
  testPath: string;
  dependencies: string[];
  templateSnapshots?: Array<{
    scope: string;
    id: string;
    kind: 'template';
    url: string;
    token: string;
  }>;
};
