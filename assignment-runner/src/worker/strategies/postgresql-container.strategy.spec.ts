import { NodeDefaultPostgresqlJestStrategy } from './node-default-postgresql-jest.strategy';
import { NodeNestJsPostgresqlJestStrategy } from './node-nestjs-postgresql-jest.strategy';

describe.each([
  new NodeDefaultPostgresqlJestStrategy(),
  new NodeNestJsPostgresqlJestStrategy(),
])('$workerType lifecycle', (strategy) => {
  const sql = `CREATE TABLE "quoted" (value text);\nINSERT INTO quoted VALUES ('$(touch /tmp/injected) " \\');`;

  function options(seed?: string) {
    const payload = strategy.buildWorkerPayload(
      { files: { 'main.ts': '' } },
      [],
    );
    return strategy.buildJobOptions(
      Buffer.from(JSON.stringify(payload)).toString('base64'),
      seed,
    );
  }

  it('uses only bootstrap and passes SQL unchanged through its file payload', () => {
    const result = options(sql);
    expect(result.initContainers?.map((container) => container.name)).toEqual([
      'eevee-worker-bootstrap',
    ]);
    expect(result.seedSql).toEqual({
      content: sql,
      targetPath: '/app/test/.eevee-init.sql',
    });
    expect(JSON.stringify(result.initContainers)).not.toContain(sql);
    expect(result.mainContainerEnv).toEqual([
      { name: 'EEVEE_INIT_SQL_FILE', value: '/app/test/.eevee-init.sql' },
    ]);
    expect(result.resources?.limits.memory).toBe('768Mi');
  });

  it('supports a database with no seed', () => {
    expect(options().mainContainerEnv).toEqual([]);
  });

  it('does not bypass the lifecycle entrypoint with the Kubernetes command', () => {
    const command = strategy.buildExecutionJobCommand({ initSqlScript: sql });
    expect(command.slice(0, 3)).toEqual([
      '/usr/local/bin/eevee-postgresql-entrypoint',
      '/bin/sh',
      '-c',
    ]);
    expect(command.join(' ')).not.toContain(sql);
    expect(command[3]).toContain('npm start');
  });
});
