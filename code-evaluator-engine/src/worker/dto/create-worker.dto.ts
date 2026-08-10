import { WorkerTestFile } from '../worker.interfaces';

export class CreateWorkerDto {
  testFilesContent?: string[];
  testFiles?: WorkerTestFile[];
  templateVariablesModuleContent?: string;
  applicationFileContent?: string;
  files?: Record<string, string> | null;
  dependencies?: string[];
  initSqlScript?: string;
}