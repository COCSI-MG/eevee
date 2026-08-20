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

/**
 * Abstract base strategy for workers that use a Postgres sidecar init container.
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

    const postgresContainer: KubernetesJobInitContainer =
      this.buildPostgresContainer();

    let seedDatabaseContainer: KubernetesJobInitContainer | undefined;
    if (initSqlScript) {
      seedDatabaseContainer = this.buildSeedDatabaseContainer(initSqlScript);
    }

    baseOptions.initContainers.push(postgresContainer);
    if (seedDatabaseContainer) {
      baseOptions.initContainers.push(seedDatabaseContainer);
    }

    return baseOptions;
  }

  private buildPostgresContainer(): KubernetesJobInitContainer {
    return {
      name: 'postgres-db',
      image: 'postgres:16',
      imagePullPolicy: 'IfNotPresent',
      restartPolicy: 'Always',
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
    return [
      'sh',
      '-c',
      `
        # Wait for Postgres to be ready
        until pg_isready -h localhost -p 5432; do
          echo "Waiting for Postgres...";
          sleep 2;
        done;
        # Run the init SQL script
        echo "${initSqlScript.replace(/\n/g, '\\n')}" | psql -h localhost -U postgres -d eevee
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
