import { WorkerExecutionStrategy } from './worker-execution-strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import {
  asShellCommand,
  buildMkdirPCommand,
  buildNpmInstallCommand,
  buildWriteFileCommand,
  normalizeTestFiles,
} from './worker-strategy-helpers';
import { parseCypressLogResult } from './worker-log-parsers';

export class NodeNextJsCypressStrategy implements WorkerExecutionStrategy {
  readonly workerType = WorkerType.NODE_NEXTJS_CYPRESS;

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[] {
    const commands: string[] = [];

    commands.push(buildMkdirPCommand('/app/cypress/e2e'));

    commands.push(
      buildWriteFileCommand(
        createWorkerData.applicationFileContent,
        '/app/student.tsx',
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
          `/app/cypress/e2e/validation${index}.cy.ts`,
        ),
      );
    });

    const install = buildNpmInstallCommand(dependencies);
    if (install) commands.push(install);

    commands.push('npm start');

    return asShellCommand(commands);
  }

  processLogResult = parseCypressLogResult;
}
