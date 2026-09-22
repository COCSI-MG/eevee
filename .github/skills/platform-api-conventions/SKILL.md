---
name: platform-api-conventions
description: 'NestJS module/DTO/entity/migration conventions in platform-api. Use when adding an API endpoint, entity, DB migration, or module in platform-api, or running its Jest/e2e tests and seed script.'
---

# platform-api Conventions (NestJS)

`platform-api/src/` is organized by feature module: `assignment/`, `attempt/`,
`class/`, `template/`, `user/`, `worker/`, `scheduling/`, `kubernetes/`,
`bullmq/`, `auth/`, `file-saver/`, `ai-report/`, etc. Each feature module
follows the same internal layout:

- `entities/` — TypeORM entities (DB schema).
- `dto/` — validation classes using `class-validator`/`class-transformer`
  decorators (`@IsEnum()`, `@IsString()`, `@MinLength()`, ...).
- `*.controller.ts` — HTTP endpoints, documented with `@ApiOperation()` for
  Swagger (served at `/api` locally).
- `*.service.ts` — `@Injectable()` business logic.
- `*.module.ts` — DI wiring.

Cross-cutting: `ClsModule` propagates request context (e.g. user id) across
services via middleware. `BullMQModule` carries async messaging (scheduling
jobs, AI report generation, file-saver events) over Redis — platform-domain
consumers live in `platform-api`, Kubernetes-execution consumers live in
`assignment-runner`.

## Common modifications

**New API endpoint:**
1. DTO in `src/feature/dto/`.
2. Method on `FeatureService`.
3. Route on `FeatureController` with `@Post()`/`@Get()` + `@ApiOperation()`.

**Database change:**
1. Edit the entity under `src/*/entities/`.
2. `npm run migration:generate -n DescriptiveNameForChange`.
3. `npm run migration:run`.

## Testing & environment

```bash
cd platform-api
npm run test          # Jest unit tests
npm run test:e2e      # e2e tests
npm run test:cov      # coverage
npm run migration:run # apply TypeORM migrations
npm run seed          # creates admin@example.com / admin123
```

Required `.env` vars: `JWT_SECRET` (generate via
`npm run script:generate-jwt-key`), `PG_*` (default
`eevee_user:eevee_password@localhost:5432`), `REDIS_HOST`/`REDIS_PORT`
(default `localhost:6379`). Loaded globally via `ConfigModule.forRoot()`.
