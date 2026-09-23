import { migrationConnection } from './migration-config';

describe('Migration .env configuration', () => {
  const env = {
    PG_HOST: '127.0.0.1',
    PG_PORT: '15432',
    PG_USERNAME: 'test-user',
    PG_PASSWORD: 'test-password',
    PG_DATABASE: 'test-db',
  };
  it('uses the file values, including a tunnel port, instead of inherited variables', () => {
    const oldHost = process.env.PG_HOST;
    process.env.PG_HOST = 'wrong-host';
    try {
      expect(migrationConnection(env)).toMatchObject({
        type: 'postgres',
        host: '127.0.0.1',
        port: 15432,
        username: 'test-user',
        password: 'test-password',
        database: 'test-db',
      });
    } finally {
      if (oldHost === undefined) delete process.env.PG_HOST;
      else process.env.PG_HOST = oldHost;
    }
  });
  it('defaults only the omitted port', () => {
    const { PG_PORT, ...withoutPort } = env;
    expect(migrationConnection(withoutPort).port).toBe(5432);
  });
  it.each(['', '0', '-1', '65536', '1.5', 'not-a-port'])(
    'rejects invalid port %s',
    (PG_PORT) => {
      expect(() => migrationConnection({ ...env, PG_PORT })).toThrow('PG_PORT');
    },
  );
  it('refuses incomplete configuration without exposing values', () => {
    expect(() => migrationConnection({ ...env, PG_DATABASE: '' })).toThrow(
      'PG_DATABASE',
    );
    try {
      migrationConnection({ ...env, PG_DATABASE: '' });
    } catch (error) {
      expect((error as Error).message).not.toContain(env.PG_PASSWORD);
    }
  });
});
