import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DatabaseService } from './../src/database/database.service';

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let databaseService: DatabaseService;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    databaseService = app.get(DatabaseService);
    await app.init();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('Should create and then list all products', async () => {
    await request(app.getHttpServer())
      .post('/')
      .send({ name: 'test', price: 1 })
      .expect(201)
      .expect({ id: 1, name: 'test', price: 1 });

    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect([{ id: 1, name: 'test', price: 1 }]);

    const allProducts = await databaseService.client
      .getRepository('Product')
      .find();

    expect(allProducts).toEqual([{ id: 1, name: 'test', price: 1 }]);
  }, 100000);
});
