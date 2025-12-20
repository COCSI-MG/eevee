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

export const DEFAULT_CYPRESS_VALIDATION_SCRIPT = `
describe("Mock Page Test", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should display the heading and paragraph", () => {
    cy.contains("h1", "Mock Page for Testing").should("be.visible");
    cy.contains(
      "p",
      "This page is designed to be targeted by Cypress tests."
    ).should("be.visible");
  });

  it("should allow typing into the input field", () => {
    const inputText = "Hello Cypress!";
    cy.get("#test-input").type(inputText).should("have.value", inputText);
  });

  it("should show an alert when the button is clicked", () => {
    cy.get("#test-button").click();
  });

  it("should have a message area", () => {
    cy.get("#message-area")
      .should("be.visible")
      .and("contain.text", "Messages will appear here.");
  });
});`

export const WorkerExibitionMap = {
  [WorkerType.NODE_DEFAULT]: "Node Default",
  [WorkerType.NODE_NESTJS]: "Node NestJS + TypeORM",
  [WorkerType.REACT_CYPRESS]: "ReactJS + Cypress",
  [WorkerType.NEXTJS_CYPRESS]: "NextJS + Cypress",
};

export const WorkerDefaultTemplateMap = {
  [WorkerType.NODE_DEFAULT]: DEFAULT_ASSIGNMENT_TEMPLATE,
  [WorkerType.NODE_NESTJS]: DEFAULT_NEST_JS_ASSIGNMENT_TEMPLATE,
  [WorkerType.REACT_CYPRESS]: DEFAULT_ASSIGNMENT_TEMPLATE,
  [WorkerType.NEXTJS_CYPRESS]: DEFAULT_ASSIGNMENT_TEMPLATE,
};

export const WorkerDefaultValidationScriptMap = {
  [WorkerType.NODE_DEFAULT]: DEFAULT_VALIDATION_SCRIPT,
  [WorkerType.NODE_NESTJS]: DEFAULT_NEST_JS_VALIDATION_SCRIPT,
  [WorkerType.REACT_CYPRESS]: DEFAULT_CYPRESS_VALIDATION_SCRIPT,
  [WorkerType.NEXTJS_CYPRESS]: DEFAULT_CYPRESS_VALIDATION_SCRIPT, 
};

export const WorkerDefinitionPresets = {
  [WorkerType.NODE_DEFAULT]: {
    startCommands: [],
    testCommands: ["npm run test"],
    dependencies: [],
  },
  [WorkerType.NODE_NESTJS]: {
    startCommands: ["npm run start:dev"],
    testCommands: ["npm run test:e2e"],
    dependencies: [],
  },
  [WorkerType.REACT_CYPRESS]: {
    startCommands: ["npm run start"],
    testCommands: ["npm run test"],
    dependencies: [],
  },
  [WorkerType.NEXTJS_CYPRESS]: {
    startCommands: ["npm run dev"],
    testCommands: ["npm run test"],
    dependencies: [],
  },
};
