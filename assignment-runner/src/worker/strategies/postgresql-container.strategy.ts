import {
  KubernetesJobInitContainer,
  KubernetesJobOptions,
} from 'src/kubernetes/kubernetes.interfaces';
import { WorkerConfig } from './worker-execution-strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { WorkerResponse } from '../worker.interfaces';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import { WORKER_DEFINITION_B64_ENV_NAME } from '../worker.constants';
import { WorkerJobPayload } from 'src/worker/worker-job-payload.type';
import { BootstrapInitContainerStrategy } from './bootstrap-init-container.strategy';
import { asShellCommand } from './worker-strategy-helpers';

const POSTGRES_READY_FILE = '/app/src/.postgres-ready';
const POSTGRES_STOP_FILE = '/app/src/.postgres-stop';

/**
 * Abstract base strategy for workers that use a Postgres sidecar container.
 */
export abstract class PostgresqlContainerStrategy extends BootstrapInitContainerStrategy {
  abstract readonly workerType: WorkerType;
  abstract readonly workerConfig: WorkerConfig;
  abstract processLogResult(log: string): WorkerResponse;

  abstract buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[];
  abstract buildExecutionJobCommand(
    createWorkerData: CreateWorkerDto,
  ): string[];
  abstract buildWorkerPayload(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): WorkerJobPayload;

  protected buildPostgresWorkerCommand(commands: string[]): string[] {
    return asShellCommand([
      `trap 'touch ${POSTGRES_STOP_FILE}' EXIT`,
      `until [ -f ${POSTGRES_READY_FILE} ]; do sleep 1; done`,
      ...commands,
    ]);
  }

  buildJobOptions(
    encodedDefinition: string,
    initSqlScript?: string,
  ): KubernetesJobOptions {
    const baseOptions = super.buildJobOptions(encodedDefinition, initSqlScript);
    if (!baseOptions.initContainers) {
      throw new Error(
        'BootstrapInitContainerStrategy requires initContainers to be defined',
      );
    }

    const postgresContainer = this.buildPostgresContainer();

    const seedDatabaseContainer =
      this.buildSeedDatabaseContainer(initSqlScript ?? '');

    baseOptions.additionalContainers = [
      postgresContainer,
      seedDatabaseContainer,
    ];

    return baseOptions;
  }

  private buildPostgresContainer(): KubernetesJobInitContainer {
    return {
      name: 'postgres-db',
      image: 'postgres:16',
      imagePullPolicy: 'IfNotPresent',
      command: [
        'sh',
        '-c',
        `
          docker-entrypoint.sh postgres &
          postgres_pid=$!;
          until [ -f ${POSTGRES_STOP_FILE} ]; do sleep 1; done;
          kill -TERM "$postgres_pid";
          wait "$postgres_pid";
        `,
      ],
      env: this.getPostgresEnvironmentVariables(),
    };
  }

  private buildSeedDatabaseContainer(
    initSqlScript: string,
  ): KubernetesJobInitContainer {
    const postgresPasswordEnv = this.getPostgresEnvironmentVariables().find(
      (env) => env.name === 'POSTGRES_PASSWORD',
    );
    if (!postgresPasswordEnv) {
      throw new Error('Postgres password environment variable is required');
    }

    return {
      name: 'seed-database',
      image: 'postgres:16',
      imagePullPolicy: 'IfNotPresent',
      command: this.buildSeedContainerCommand(initSqlScript),
      env: [
        { name: postgresPasswordEnv.name, value: postgresPasswordEnv.value },
      ],
    };
  }

  private buildSeedContainerCommand(initSqlScript: string): string[] {
    const encodedSql = Buffer.from(initSqlScript).toString('base64');

    return [
      'sh',
      '-c',
      `
        until pg_isready -h localhost -p 5432; do
          sleep 2;
        done;
        ${encodedSql ? `echo "${encodedSql}" | base64 -d | psql -h localhost -U postgres -d eevee || exit 1;` : ''}
        touch ${POSTGRES_READY_FILE};
      `,
    ];
  }

  private getPostgresEnvironmentVariables() {
    const postgresUser = { name: 'POSTGRES_USER', value: 'postgres' };
    const postgresPassword = { name: 'POSTGRES_PASSWORD', value: 'postgres' };
    const postgresDb = { name: 'POSTGRES_DB', value: 'eevee' };

    return [postgresUser, postgresPassword, postgresDb];
  }
}
