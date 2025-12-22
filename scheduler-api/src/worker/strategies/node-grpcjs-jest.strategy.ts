import { WorkerExecutionStrategy } from './worker-execution-strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import {
  asShellCommand,
  buildDownloadArtifactCommand,
  buildExtractArtifactCommand,
  buildNpmInstallCommand,
} from './worker-strategy-helpers';
import { parseJestLogResult } from './worker-log-parsers';

export class NodeGrpcJsJestStrategy implements WorkerExecutionStrategy {
  readonly workerType = WorkerType.NODE_GRPCJS;

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[] {
    const commands: string[] = [];

    commands.push(buildDownloadArtifactCommand());
    commands.push(buildExtractArtifactCommand());

    const install = buildNpmInstallCommand(dependencies);
    if (install) commands.push(install);

    commands.push('npm start');

    return asShellCommand(commands);
  }

  processLogResult = parseJestLogResult;
}
