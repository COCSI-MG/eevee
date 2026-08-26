import { NestFactory } from '@nestjs/core';
import { CodeEvaluatorEngineAppModule } from './orchestrator-app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    CodeEvaluatorEngineAppModule,
  );
  app.enableShutdownHooks();
}

bootstrap();