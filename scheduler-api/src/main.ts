import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const corsOrigins = [
    new RegExp(/localhost:\d+/),
    new RegExp(
      /^https?:\/\/((www|frontend)\.)?eeveecodelab\.(local|site|com|online)$/,
    ),
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
