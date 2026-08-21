import { NestFactory } from '@nestjs/core';
import { QueueWorkerModule } from './queue-worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(QueueWorkerModule);
  app.enableShutdownHooks();
}

bootstrap();
