import { WorkerTestFile } from '../worker.interfaces';
import type { ExecutionTemplateSnapshot } from '@eevee/execution-contracts';

export class CreateWorkerDto {
  executionMode?: 'graded' | 'adhoc';
  testFilesContent?: string[];
  testFiles?: WorkerTestFile[];
  templateVariablesModuleContent?: string;
  applicationFileContent?: string;
  files?: Record<string, string> | null;
  dependencies?: string[];
  initSqlScript?: string;
  templateSnapshots?: ExecutionTemplateSnapshot[];
}
