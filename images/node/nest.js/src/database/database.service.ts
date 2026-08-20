import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(private dataSource: DataSource) {}
  get client(): DataSource {
    return this.dataSource;
  }
  async onModuleDestroy() {
    await this.dataSource.destroy();
  }
}
