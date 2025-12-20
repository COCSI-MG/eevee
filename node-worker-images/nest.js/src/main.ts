const isTestRun =
  typeof process !== 'undefined' &&
  (
    process.env.NODE_ENV === 'test' ||
    !!process.env.JEST_WORKER_ID ||
    (process.env.npm_lifecycle_event?.startsWith('test') ?? false) ||
    process.argv.some((arg) => arg.toLowerCase().includes('jest'))
  );

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // E2E tests use `app.getHttpServer()`; they do not require binding to a fixed port.
  // Avoid `listen(3000)` entirely under Jest to prevent flaky EADDRINUSE failures.
  if (isTestRun) {
    await app.init();
    return app;
  }

  await app.listen(process.env.PORT ?? 3000);
  return app;
}

// Only auto-start the HTTP server when this file is the program entrypoint.
// When imported by tests, do not start listening on a fixed port.
if (!isTestRun && typeof require !== 'undefined' && require.main === module) {
  void bootstrap();
}
