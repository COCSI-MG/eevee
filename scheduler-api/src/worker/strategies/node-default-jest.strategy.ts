import { WorkerExecutionStrategy } from './worker-execution-strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import {
  asShellCommand,
  buildNpmInstallCommand,
  buildWriteFileCommand,
  normalizeTestFiles,
} from './worker-strategy-helpers';
import { parseJestLogResult } from './worker-log-parsers';

export class NodeDefaultJestStrategy implements WorkerExecutionStrategy {
  readonly workerType = WorkerType.NODE_DEFAULT;

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[] {
    const commands: string[] = [];

    commands.push(
      buildWriteFileCommand(
        createWorkerData.applicationFileContent,
        '/app/app.ts',
      ),
    );

    commands.push(
      buildWriteFileCommand(
        createWorkerData.templateVariablesModuleContent ?? '',
        '/app/template-variables.ts',
      ),
    );

    const normalizedTestFiles = normalizeTestFiles(
      createWorkerData.testFilesContent,
      createWorkerData.testFiles,
    );

    normalizedTestFiles.forEach((testFile, index) => {
      commands.push(
        buildWriteFileCommand(
          testFile.content,
          `/app/validation${index}.test.ts`,
        ),
      );
    });

    const install = buildNpmInstallCommand(dependencies);
    if (install) commands.push(install);

    commands.push('npm start');

    return asShellCommand(commands);
  }

  processLogResult = parseJestLogResult;
}
