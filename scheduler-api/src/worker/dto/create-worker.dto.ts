import { WorkerTestFile } from '../worker.interfaces';

export class CreateWorkerDto {
  testFilesContent: string[];
  testFiles?: WorkerTestFile[];
  templateVariablesModuleContent?: string;
  applicationFileContent: string;
  dependencies: string[]
}
