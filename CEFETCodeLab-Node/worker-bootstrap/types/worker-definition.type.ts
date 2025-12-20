export type WorkerFilesNode = {
  id: string;
  children: Array<WorkerFilesNode> | null;
  type: "file" | "folder";
  content?: string;
};

export type WorkerDefinition = {
  testPath: string;
  srcPath: string;
  files: WorkerFilesNode;
  startCommands: string[];
  testCommands: string[];
  dependencies: string[];
};