import { NestFactory } from '@nestjs/core';
import { AssignmentRunnerAppModule } from './orchestrator-app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    AssignmentRunnerAppModule,
  );
  app.enableShutdownHooks();
}

bootstrap();
