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
  async getProducts(): Promise<Product[]> {
    const products = await this.appService.getProducts();

    return products;
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
