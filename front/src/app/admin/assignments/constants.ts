import { WorkerType } from "@/app/interface/scheduler-api/worker";

export const DEFAULT_ASSIGNMENT_TEMPLATE = `// PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
export function main() {
  // YOUR CODE HERE
  console.log('Hello, world!');
}`;

export const DEFAULT_VALIDATION_SCRIPT = `
import { main } from './app';

function math_add(a: number, b: number) {
  return a + b;
}

function math_sub(a: number, b: number) {
  return a - b;
}

function math_mul(a: number, b: number) {
  return a * b;
}

function math_div(a: number, b: number) {
  return a / b;
}

describe('main', () => {
  it('should be able to sum', () => {
    const correctResult = math_add(2, 3);
    const providedResult = main(2, 3);
    expect(providedResult[0]).toEqual(correctResult);
  });
  it('should be able to subtract', () => {
    const correctResult = math_sub(2, 3);
    const providedResult = main(2, 3);
    expect(providedResult[1]).toEqual(correctResult);
  });
  it('should be able to multiply', () => {
    const correctResult = math_mul(2, 3);
    const providedResult = main(2, 3);
    expect(providedResult[2]).toEqual(correctResult);
  });
  it('should be able to divide', () => {
    const correctResult = math_div(2, 3);
    const providedResult = main(2, 3);
    expect(providedResult[3]).toEqual(correctResult);
  });
});
`;

export const DEFAULT_NEST_JS_ASSIGNMENT_TEMPLATE = `
import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Post,
} from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { Entity, Column, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { DatabaseService } from './database/database.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;
}

@Injectable()
export class AppService {
  private readonly productRepository: Repository<Product>;
  constructor(databaseService: DatabaseService) {
    this.productRepository = databaseService.client.getRepository(Product);
  }
  getProducts(): Promise<Product[]> {
    return this.productRepository.find();
  }

  createProduct(name: string, price: number): Promise<Product> {
    const product = new Product();
    product.name = name;
    product.price = price;
    return this.productRepository.save(product);
  }
}

class CreateProductDto {
  name: string;
  price: number;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getProducts(): Promise<Product[]> {
    return this.appService.getProducts();
  }

  @Post()
  createProduct(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.appService.createProduct(
      createProductDto.name,
      createProductDto.price,
    );
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      dropSchema: true,
      autoLoadEntities: true,
      synchronize: true,
      entities: [__dirname + '/**/*{.ts,.js}'],
      retryAttempts: 10,
      retryDelay: 100,
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;

export const DEFAULT_NEST_JS_VALIDATION_SCRIPT = `
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
  });
});
`;

export const DEFAULT_GRPC_JS_ASSIGNMENT_TEMPLATE = `import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import fs from "fs";
import os from "os";
import path from "path";

const PROTO_SRC = (
  'syntax = "proto3";'
  + 'package movie;'
  + 'import "google/protobuf/empty.proto";'
  + 'message Movie { int32 id = 1; string title = 2; }'
  + 'message GetById { int32 id = 1; }'
  + 'message ListMoviesResponse { repeated Movie movies = 1; }'
  + ''
  + 'service MovieService {'
  + '  rpc ListMovies(google.protobuf.Empty) returns (ListMoviesResponse);'
  + '  rpc GetMovie(GetById) returns (Movie);'
  + '  rpc CreateMovie(Movie) returns (Movie);'
  + '  rpc DeleteMovie(GetById) returns (google.protobuf.Empty);'
  + '}'
  + ''
);

export function main() {
  const protoPath = path.join(os.tmpdir(), 'movie-proto-' + Date.now() + '.proto');
  fs.writeFileSync(protoPath, PROTO_SRC, 'utf8');

  const def = protoLoader.loadSync(protoPath, {});
  const pkg = (grpc.loadPackageDefinition(def) as any).movie;

  const movies: Array<{ id: number; title: string }> = [];
  let nextId = 1;

  const server = new grpc.Server();

  server.addService(pkg.MovieService.service, {
    ListMovies: (call: any, cb: any) => cb(null, { movies }),
    GetMovie: (call: any, cb: any) => {
      const m = movies.find((x) => x.id === call.request.id);
      if (!m) return cb({ code: grpc.status.NOT_FOUND, details: 'Movie not found' });
      cb(null, m);
    },
    CreateMovie: (call: any, cb: any) => {
      const obj = { id: nextId++, title: call.request.title || '' };
      movies.push(obj);
      cb(null, obj);
    },
    DeleteMovie: (call: any, cb: any) => {
      const idx = movies.findIndex((x) => x.id === call.request.id);
      if (idx === -1) return cb({ code: grpc.status.NOT_FOUND, details: 'Movie not found' });
      movies.splice(idx, 1);
      cb(null, {});
    },
  });

  const port = process.env.PORT || '50053';
  server.bindAsync('0.0.0.0:' + port, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) throw err;
    server.start();
  });

  return server;
}
`;

export const DEFAULT_GRPC_JS_VALIDATION_SCRIPT = `
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import os from "os";
import fs from "fs";

describe("gRPC MovieService", () => {
  let server: grpc.Server;
  let client: any;
  const PROTO_SRC = (
    'syntax = "proto3";'
    + 'package movie;'
    + 'import "google/protobuf/empty.proto";'
    + 'message Movie { int32 id = 1; string title = 2; }'
    + 'message GetById { int32 id = 1; }'
    + 'message ListMoviesResponse { repeated Movie movies = 1; }'
    + ''
    + 'service MovieService {'
    + '  rpc ListMovies(google.protobuf.Empty) returns (ListMoviesResponse);'
    + '  rpc GetMovie(GetById) returns (Movie);'
    + '  rpc CreateMovie(Movie) returns (Movie);'
    + '  rpc DeleteMovie(GetById) returns (google.protobuf.Empty);'
    + '}'
    + ''
  );

  beforeAll(() => {
    const protoPath = path.join(os.tmpdir(), 'movie-proto-' + Date.now() + '.proto');
    fs.writeFileSync(protoPath, PROTO_SRC, 'utf8');

    const def = protoLoader.loadSync(protoPath, {});
    const pkg = (grpc.loadPackageDefinition(def) as any).movie;

    server = new grpc.Server();

    const movies: Array<{ id: number; title: string }> = [];
    let nextId = 1;

    server.addService(pkg.MovieService.service, {
      ListMovies: (call: any, cb: any) => cb(null, { movies }),
      GetMovie: (call: any, cb: any) => {
        const m = movies.find((x) => x.id === call.request.id);
        if (!m) return cb({ code: grpc.status.NOT_FOUND, details: 'Movie not found' });
        cb(null, m);
      },
      CreateMovie: (call: any, cb: any) => {
        const obj = { id: nextId++, title: call.request.title || '' };
        movies.push(obj);
        cb(null, obj);
      },
      DeleteMovie: (call: any, cb: any) => {
        const idx = movies.findIndex((x) => x.id === call.request.id);
        if (idx === -1) return cb({ code: grpc.status.NOT_FOUND, details: 'Movie not found' });
        movies.splice(idx, 1);
        cb(null, {});
      },
    });

    const port = process.env.PORT || '50053';
    server.bindAsync('0.0.0.0:' + port, grpc.ServerCredentials.createInsecure(), (err) => {
      if (err) throw err;
      server.start();
    });

    client = new pkg.MovieService(
      'localhost:' + port,
      grpc.credentials.createInsecure(),
    );
  });

  afterAll(() => {
    server.forceShutdown();
  });

  it("should create and list movies", (done) => {
    client.CreateMovie({ title: "Inception" }, (err: any, movie: any) => {
      expect(err).toBeNull();
      expect(movie).toHaveProperty("id");
      expect(movie.title).toBe("Inception");

      client.ListMovies({}, (err: any, response: any) => {
        expect(err).toBeNull();
        expect(response.movies.length).toBe(1);
        expect(response.movies[0].title).toBe("Inception");
        done();
      });
    });
  });
});
`;

export const WorkerExibitionMap = {
  [WorkerType.NODE_DEFAULT]: "Node Default",
  [WorkerType.NODE_NESTJS]: "Node NestJS + TypeORM",
  [WorkerType.NODE_GRPCJS]: "GRPC using gRPCJS",
};

export const WorkerDefaultTemplateMap = {
  [WorkerType.NODE_DEFAULT]: DEFAULT_ASSIGNMENT_TEMPLATE,
  [WorkerType.NODE_NESTJS]: DEFAULT_NEST_JS_ASSIGNMENT_TEMPLATE,
  [WorkerType.NODE_GRPCJS]: DEFAULT_GRPC_JS_ASSIGNMENT_TEMPLATE,
};

export const WorkerDefaultValidationScriptMap = {
  [WorkerType.NODE_DEFAULT]: DEFAULT_VALIDATION_SCRIPT,
  [WorkerType.NODE_NESTJS]: DEFAULT_NEST_JS_VALIDATION_SCRIPT,
  [WorkerType.NODE_GRPCJS]: DEFAULT_GRPC_JS_VALIDATION_SCRIPT,
};
