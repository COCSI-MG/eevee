export type TemplateSnapshot = {
  scope: string;
  id: string;
  kind: 'template';
  url: string;
  token: string;
};

export type WorkerDefinition = {
  testPath: string;
  srcPath: string;
  files: Record<string, string> | null;
  testFiles: Record<string, string> | null;
  dependencies: string[];
  templateSnapshots?: TemplateSnapshot[];
};
