import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { startProcessMetrics } from './diagnostics/process-metrics';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  if (process.env.EEVEE_METRICS_PORT) {
    const metrics = startProcessMetrics(Number(process.env.EEVEE_METRICS_PORT), process.env.EEVEE_METRICS_TOKEN || '');
    await metrics.ready;
    app.use(metrics.middleware);
    app.getHttpServer().once('close', metrics.close);
  }

  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const corsOrigins = [
    new RegExp(/localhost:\d+/),
    new RegExp(
      /^https?:\/\/((www|frontend)\.)?eeveecodelab\.(local|site|com|online)$/,
    ),
    new RegExp(/^https?:\/\/[a-z0-9.-]+\.testbeds\.rnp\.br$/),
    ...configuredOrigins,
  ];

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  });

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  app.set('trust proxy', true);

  const config = new DocumentBuilder()
    .setTitle('CodeLabSchedulerAPI')
    .setDescription(
      "API for handling scheduling of applicants' tests in CodeLab",
    )
    .setVersion('1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
