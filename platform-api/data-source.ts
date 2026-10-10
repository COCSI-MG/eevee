import { readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { parse } from 'dotenv';
import { DataSource } from 'typeorm';
import { register } from 'tsconfig-paths';
import { migrationConnection } from './scripts/migration-config';

// Resolve from this file, never the caller's working directory.
const extension = extname(__filename) === '.ts' ? 'ts' : 'js';
const packageRoot = extension === 'ts' ? __dirname : resolve(__dirname, '..');
const envPath = join(packageRoot, '.env');
let environment: Record<string, string>;
try {
  environment = parse(readFileSync(envPath));
} catch {
  throw new Error(`Cannot read migration configuration: ${envPath}`);
}

// Compiled entities retain imports such as src/user/entities/user.entity.
register({ baseUrl: __dirname, paths: { 'src/*': ['src/*'] } });
const glob = (pattern: string) =>
  join(__dirname, 'src', pattern).replace(/\\/g, '/');

// TypeORM CLI owns initialization and teardown. Importing this module never connects.
export const AppDataSource = new DataSource({
  ...migrationConnection(environment),
  entities: [glob(`**/*.entity.${extension}`)],
  migrations: [glob(`migrations/*.${extension}`)],
  synchronize: false,
  migrationsRun: false,
  dropSchema: false,
  migrationsTransactionMode: 'all',
});
