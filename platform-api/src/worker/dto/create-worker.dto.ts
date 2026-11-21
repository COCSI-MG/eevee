import { WorkerTestFile } from '../worker.interfaces';
import type {
  ExecutionSourceSnapshot,
  ExecutionTemplateSnapshot,
} from '@eevee/execution-contracts';

export class CreateWorkerDto {
  sourceSnapshot?: ExecutionSourceSnapshot;
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
