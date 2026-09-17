import { KubernetesJobOptions } from 'src/kubernetes/kubernetes.interfaces';
import { BootstrapInitContainerStrategy } from './bootstrap-init-container.strategy';

/** PostgreSQL runs inside the worker, owned by its lifecycle entrypoint. */
export abstract class PostgresqlContainerStrategy extends BootstrapInitContainerStrategy {
  protected withPostgresql(command: string[]): string[] {
    // Kubernetes command overrides ENTRYPOINT, so invoke it explicitly.
    return ['/usr/local/bin/eevee-postgresql-entrypoint', ...command];
  }

  buildJobOptions(
    encodedDefinition: string,
    initSqlScript?: string,
  ): KubernetesJobOptions {
    return {
      ...super.buildJobOptions(encodedDefinition),
      ...(initSqlScript
        ? {
            seedSql: {
              content: initSqlScript,
              targetPath: `${this.workerConfig.testPath}/.eevee-init.sql`,
            },
          }
        : {}),
      activeDeadlineSeconds: 210,
      ttlSecondsAfterFinished: 900,
      resources: {
        requests: { cpu: '100m', memory: '256Mi' },
        limits: { cpu: '1', memory: '768Mi' },
      },
      mainContainerEnv: initSqlScript
        ? [
            {
              name: 'EEVEE_INIT_SQL_FILE',
              value: `${this.workerConfig.testPath}/.eevee-init.sql`,
            },
          ]
        : [],
    };
  }
}
