# EEVEE Codebase Instructions

## Architecture Overview

**EEVEE** is an Educational Exercises and Video-based E-learning Environment built as a microservices architecture:

- **`front/`** (Next.js 15) - Web UI for assignments and code submission
- **`platform-api/`** (NestJS) - Public API: manages users, assignments, attempts, and realtime updates
- **`assignment-runner/`** (NestJS) - Internal consumer that evaluates prepared code submissions in Kubernetes
- **`images/`** - Containerized execution environments; runtime workers are grouped in `images/node/`
- **`infrastructure/`** - Docker Compose services (Redis, PostgreSQL, Helm and Minikube config)

**Data flow:** Frontend → Scheduler API → BullMQ (Redis) → Worker pods (via Kubernetes) → logs/results back to API

## Critical Setup Commands

Always start infrastructure in this order:

```bash
# Terminal 1: Kubernetes & Worker images
minikube start --driver=docker
cd images/node/node-default && docker build . -t worker-node-default-img:latest
minikube image load worker-node-default-img:latest
# (Repeat for other workers: nest.js, grpc, next.js-cypress)

# Terminal 2: Core services (Redis, PostgreSQL)
cd infrastructure && docker compose up -d

# Terminal 3: Scheduler API
cd platform-api && npm install && npm run start:dev

# Terminal 4: Frontend
cd assignment-runner && npm install && npm run start:dev
cd front && npm install && npm run dev
```

Use `make up` to start everything, `make up-scheduler` for API only, or `make up-front` for frontend.

## Worker Execution Pattern (Key Concept)

Workers are Kubernetes jobs that execute student code in isolation. The pattern:

1. **Worker Type Registry** (`scheduler-api/src/worker/enum/worker-type.enum.ts`): Define new types (e.g., `NODE_NEXTJS_CYPRESS`)
2. **Worker Service** (`scheduler-api/src/worker/worker.service.ts`): Maps type → Kubernetes job creation
3. **Scheduling Service** (`scheduler-api/src/scheduling/scheduling.service.ts`): Routes requests based on `assignment.workerType`

Worker files are injected via base64-encoded shell commands; output parsed for test results (see `processLogResult()`).

## Module Dependencies (NestJS Organization)

Key modules in `scheduler-api`:

- **SchedulingModule** - Orchestrates assignment execution
- **WorkerModule** + **KubernetesModule** - Manages worker lifecycle
- **AssignmentModule** - Defines problems; validates template compatibility with `workerType`
- **TemplateModule** - Boilerplate code; filtered by `workerType`
- **AuthModule** - JWT-based auth; see `jwt.strategy.ts` for token validation
- **FileSaverModule** - Syncs student files to GitHub via a BullMQ consumer (`file-saver-queue`)
- **BullMQModule** - Async messaging over Redis (scheduling jobs, AI reports, file sync events)

Use `ClsModule` for request context (user ID injection across services via middleware).

## Testing & Debugging

```bash
cd platform-api
npm run test         # Unit tests (Jest)
npm run test:e2e     # E2E tests
npm run test:cov     # Coverage report
npm run migration:run # Apply DB migrations (TypeORM)
```

Default test credentials: `admin@example.com:admin123` (run `npm run seed`).

Frontend linting: `cd front && npm run lint`

## File Structure Patterns

- **`src/*/entities/`** - TypeORM entities (DB schema)
- **`src/*/dto/`** - Validation classes (class-validator, class-transformer)
- **`src/*/*.controller.ts`** - HTTP endpoints with Swagger docs
- **`src/*/*.service.ts`** - Business logic; @Injectable() providers
- **`src/*/*.module.ts`** - Dependency injection configuration

DTOs use decorators for validation: `@IsEnum()`, `@IsString()`, `@MinLength()`, etc.

## Common Modifications

**Add a new worker type:**

1. Add to `WorkerType` enum
2. Create the Dockerfile under `images/new-type/` or `images/node/new-type/`
3. Create `new-type/worker-definition.json`
4. Add handler method in `WorkerService`
5. Register in `SchedulingService.workerMap` constructor

**Add a new API endpoint:**

1. Create DTO in `src/feature/dto/`
2. Add method to `FeatureService`
3. Add route to `FeatureController` with `@Post()` / `@Get()` decorators
4. Use `@ApiOperation()` for Swagger docs

**Database changes:**

1. Modify entity in `src/*/entities/`
2. Run `npm run migration:generate -n DescriptiveNameForChange`
3. Run `npm run migration:run`

## Configuration (Environment Variables)

Required in `.env`:

- `JWT_SECRET` - Generate with `npm run script:generate-jwt-key`
- `PG_*` - PostgreSQL credentials (default: `eevee_user:eevee_password@localhost:5432`)
- `REDIS_HOST` / `REDIS_PORT` - Default: `localhost:6379` (BullMQ broker)

Loaded via `ConfigModule.forRoot()` (global scope).

## Performance & Gotchas

- **Worker Image Caching**: Always `minikube image load` after docker build; old images cached in K8s
- **Kubernetes Context**: Verify `kubectl config current-context` (must be `minikube`)
- **Test Log Parsing**: Worker output must include `Tests: X passed, Y total` line for score calculation
- **Base64 Injection**: Long files may exceed shell command limits; consider streaming approach if issues arise
- **BullMQ ownership**: Platform-domain consumers run in Platform API; Kubernetes execution consumers run in Assignment Runner

## Resources

- [Swagger API Docs](http://localhost:3000/api) - Auto-generated from `@ApiOperation()` decorators
- `README.md` in each module directory - Specific setup instructions
- Architecture diagram: `eevee-c4-architectural-view-v2.drawio`
