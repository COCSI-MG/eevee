import { DataSource } from 'typeorm';
import { HashUtils } from '../src/utils/hash.utils';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '.env') });

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async seed() {
    const adminHashPassword = HashUtils.hashPassword('admin123');
    const userHashPassword = HashUtils.hashPassword('student123');

    await this.dataSource.query(
      `INSERT INTO "user" ("email", "passwordHash", "isAdmin", "name")
       VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
       ON CONFLICT ("email") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash"`,
      [
        'admin@example.com',
        adminHashPassword,
        true,
        'admin',
        'student@example.com',
        userHashPassword,
        false,
        'student',
      ],
    );

    console.log('Seed completed successfully!');
  }
}

async function run() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    synchronize: false,
  });

  await dataSource.initialize();
  const seeder = new DatabaseSeeder(dataSource);
  await seeder.seed();
  await dataSource.destroy();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
