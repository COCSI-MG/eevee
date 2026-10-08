import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

/** Use only the explicitly loaded .env; inherited shell variables cannot redirect migrations. */
export function migrationConnection(
  env: Record<string, string>,
): PostgresConnectionOptions {
  const required = [
    'PG_HOST',
    'PG_USERNAME',
    'PG_PASSWORD',
    'PG_DATABASE',
  ] as const;
  const missing = required.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `Missing migration configuration in platform-api/.env: ${missing.join(', ')}`,
    );
  }
  const port = env.PG_PORT === undefined ? 5432 : Number(env.PG_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      'PG_PORT in platform-api/.env must be an integer between 1 and 65535.',
    );
  }
  return {
    type: 'postgres',
    host: env.PG_HOST,
    port,
    username: env.PG_USERNAME,
    password: env.PG_PASSWORD,
    database: env.PG_DATABASE,
    connectTimeoutMS: 10000,
  };
}
