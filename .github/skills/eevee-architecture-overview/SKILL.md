---
name: eevee-architecture-overview
description: "Orient in the EEVEE codebase: service boundaries, local dev setup, and where to look for a given concern. Use when starting work in this repo, unsure which service (front, platform-api, assignment-runner, images) owns a change, or need the local infra bring-up order (minikube, docker compose, npm run start:dev)."
---

# EEVEE Architecture Overview

EEVEE (Educational Exercises and Video-based E-learning Environment) is a
microservices repo with the following components.

- **`front/`** (Next.js 15) — student/teacher web UI.
- **`platform-api/`** (NestJS) — public API: users, classes, assignments,
  attempts, templates, realtime,  GitHub file-saver sync, AI reports. Owns
  `scheduling`, `worker`, and `kubernetes` submodules for the platform-facing
  side of job orchestration (`platform-api/src/worker`,
  `platform-api/src/kubernetes`, `platform-api/src/scheduling`).
- **`assignment-runner/`** — the actual Kubernetes execution side. Has its own
  `src/worker/strategies/*` (one strategy class per worker type) and
  `src/kubernetes/kubernetes.service.ts` (Job/Pod lifecycle against the
  cluster). See the [worker-execution-strategies skill](../worker-execution-strategies/SKILL.md).
- **`file-storage-api/`** — HTTP service for workspace files and execution
  snapshots. See the [service guide](../../../file-storage-api/README.md).
- **`images/`** — container images executed as Kubernetes Jobs:
  `images/node/{node-default,node-teraorm,nest.js,next.js-cypress,grpc,reactjs-cypress}`,
  `images/python-default/`, `images/javascript-default/`,
  `images/worker-bootstrap/` (the init container that materializes student
  files into the shared volume before the worker container runs).
- **`infrastructure/`** — Docker Compose (Redis, PostgreSQL) + Helm/Minikube
  config for local Kubernetes.

**Data flow:** Frontend → `platform-api` → BullMQ (Redis) → `assignment-runner`
creates a Kubernetes Job → worker image runs student code → logs parsed →
results flow back through BullMQ.

## Local bring-up order

Use the [local development guide](../../../docs/local-development.md) to
configure and start the infrastructure and services from the repository root.

## Gotchas

- Always `minikube image load` after `docker build` — Kubernetes will keep
  using the stale cached image otherwise.
- Verify `kubectl config current-context` is `minikube` before creating Jobs
  locally.
- Worker output must contain a `Tests: X passed, Y total`-shaped line or score
  parsing in `processLogResult()` breaks — see
  `assignment-runner/src/worker/strategies/worker-log-parsers.ts`.

## Where to go next

- Adding/changing a worker type → [worker-execution-strategies](../worker-execution-strategies/SKILL.md)
- Kubernetes Job/Pod shape, volumes, init containers → [kubernetes-job-orchestration](../kubernetes-job-orchestration/SKILL.md)
- NestJS module conventions in `platform-api` → [platform-api-conventions](../platform-api-conventions/SKILL.md)
- Building and validating database workers → [PostgreSQL worker guide](../../../images/node/postgresql/README.md)
