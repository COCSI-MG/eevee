import { WorkerExecutionStrategy } from './worker-execution-strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import {
  asShellCommand,
  buildDownloadArtifactCommand,
  buildExtractArtifactCommand,
  buildMkdirPCommand,
  buildNpmInstallCommand,
} from './worker-strategy-helpers';
import { parseCypressLogResult } from './worker-log-parsers';

export class NodeNextJsCypressStrategy implements WorkerExecutionStrategy {
  readonly workerType = WorkerType.NODE_NEXTJS_CYPRESS;

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[] {
    const commands: string[] = [];

    // Ensure Cypress folder exists even if artifact is missing it.
    commands.push(buildMkdirPCommand('/app/cypress/e2e'));
    commands.push(buildDownloadArtifactCommand());
    commands.push(buildExtractArtifactCommand());

    const install = buildNpmInstallCommand(dependencies);
    if (install) commands.push(install);

    commands.push('npm start');

    return asShellCommand(commands);
  }

  processLogResult = parseCypressLogResult;
}
