export type SourceSnapshot = {
  scope: string;
  id: string;
  kind: 'preview' | 'submission' | 'answer-key';
  url: string;
  token: string;
};

export type WorkerDefinition = {
  testPath: string;
  srcPath: string;
  files: Record<string, string> | null;
  sourceSnapshot?: SourceSnapshot;
  testFiles: Record<string, string> | null;
  dependencies: string[];
};
