import { WorkerTestFile } from '../worker.interfaces';

export class CreateWorkerDto {
  executionMode?: 'graded' | 'adhoc';
  testFilesContent?: string[];
  testFiles?: WorkerTestFile[];
  templateVariablesModuleContent?: string;
  applicationFileContent?: string;
  files?: Record<string, string> | null;
  dependencies?: string[];
  initSqlScript?: string;
}
