---
name: worker-execution-strategies
description: 'Add or modify a worker type (e.g. a new language/framework runner, or a database-backed variant) in assignment-runner. Use when touching WorkerType enum, worker/strategies/*.strategy.ts, worker-definition.json, or WorkerService/SchedulingService wiring.'
---

# Worker Execution Strategies

Each worker type (`node-default`, `node-teraorm`, `nest.js`+postgres,
`python-default`, cypress variants, grpc, ...) is a strategy class under
`assignment-runner/src/worker/strategies/`. The strategy is the single place
that knows how to turn a `CreateWorkerDto` into a Kubernetes Job.

## Class hierarchy

```text
WorkerExecutionStrategy (interface, worker-execution-strategy.ts)
└── BootstrapInitContainerStrategy (bootstrap-init-container.strategy.ts)
    │   adds the shared emptyDir volume + `eevee-worker-bootstrap` init
    │   container that materializes student files before the worker runs
    └── PostgresqlContainerStrategy (postgresql-container.strategy.ts)
        adds `postgres-db` + optional `seed-database` init containers
        (⚠️ see [postgresql-worker-harness spec](../../specs/postgresql-worker-harness.md)
        — this pattern is being replaced, do not copy it for new database workers)
```

Concrete strategies (`node-default-jest.strategy.ts`,
`node-nestjs-postgresql-jest.strategy.ts`, `python-default.strategy.ts`, etc.)
implement:

- `buildExecutionJobCommand(createWorkerData)` — the command run inside the
  worker container.
- `buildJobCommand(...)` — **deprecated**, kept for backward compatibility only.
- `buildWorkerPayload(createWorkerData, dependencies)` — what gets base64
  encoded into `WORKER_DEFINITION_B64_ENV_NAME` for the bootstrap container.
- `processLogResult(log)` — parses worker stdout/stderr into a
  `WorkerResponse` (score, pass/fail, details). See
  `worker-log-parsers.ts` for shared regex helpers — output must contain a
  `Tests: X passed, Y total`-shaped line.
- `buildJobOptions(encodedDefinition, initSqlScript?)` (optional override) —
  additional init containers / volumes beyond the bootstrap default.

## Adding a new worker type

1. Add the type to `WorkerType` enum
   (`assignment-runner/src/worker/enum/worker-type.enum.ts`, and keep
   `platform-api/src/worker` in sync if it has its own copy).
2. Add a Dockerfile under `images/<family>/<name>/` (or extend an existing
   base image).
3. Create a strategy class extending `BootstrapInitContainerStrategy` (or
   `PostgresqlContainerStrategy` only if you are keeping the legacy sidecar
   pattern — prefer the new harness design for anything database-backed).
4. Register the strategy wherever strategies are mapped by `WorkerType`
   (check `worker.service.ts` / `worker.module.ts` providers).
5. If the assignment/template system needs to validate compatibility, update
   `AssignmentModule`/`TemplateModule` in `platform-api`.

## Gotchas

- Files are injected into the worker via base64-encoded env vars
  (`WORKER_DEFINITION_B64_ENV_NAME`), not files copied at build time — long
  student submissions can hit shell/env size limits.
- `restartPolicy: 'Always'` on an init container is what makes Kubernetes
  treat it as a long-lived sidecar (K8s 1.28+ sidecar containers feature).
  The legacy cluster this repo targets does **not** reliably support that —
  see [postgresql-worker-harness spec](../../specs/postgresql-worker-harness.md)
  before adding any new sidecar-shaped init container.
