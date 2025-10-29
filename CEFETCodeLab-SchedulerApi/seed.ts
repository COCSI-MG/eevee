import { DataSource } from 'typeorm';
import { HashUtils } from './src/utils/hash.utils';

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async seed() {
    const adminHashPassword = HashUtils.hashPassword('admin123');
    const userHashPassword = HashUtils.hashPassword('student123');

    await this.dataSource.query(
      `INSERT INTO users (email, hashPassword, isAdmin, name) VALUES (?, ?, ?, ?), (?, ?, ?, ?)`,
      [
        "admin@example.com", adminHashPassword, true, "admin",
        "student@example.com", userHashPassword, false, "student"
      ]
    );
  }
}
