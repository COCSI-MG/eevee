---
name: eevee-architecture-overview
description: "Orient in the EEVEE codebase: service boundaries, local dev setup, and where to look for a given concern. Use when starting work in this repo, unsure which service (front, platform-api, assignment-runner, images) owns a change, or need the local infra bring-up order (minikube, docker compose, npm run start:dev)."
---

# EEVEE Architecture Overview

EEVEE (Educational Exercises and Video-based E-learning Environment) is a
microservices repo. Do not trust `.github/copilot-instructions.md` blindly —
it describes an older `scheduler-api` / `code-evaluator-engine` split; the
current split is:

- **`front/`** (Next.js 15) — student/teacher web UI.
- **`platform-api/`** (NestJS) — public API: users, classes, assignments,
  attempts, templates, realtime, GitHub file-saver sync, AI reports. Owns
  `scheduling`, `worker`, and `kubernetes` submodules for the platform-facing
  side of job orchestration (`platform-api/src/worker`,
  `platform-api/src/kubernetes`, `platform-api/src/scheduling`).
- **`assignment-runner/`** — the actual Kubernetes execution side. Has its own
  `src/worker/strategies/*` (one strategy class per worker type) and
  `src/kubernetes/kubernetes.service.ts` (Job/Pod lifecycle against the
  cluster). See the [worker-execution-strategies skill](../worker-execution-strategies/SKILL.md).
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

```bash
# 1. Kubernetes & worker images
minikube start --driver=docker
cd images/node/node-default && docker build . -t worker-node-default-img:latest
minikube image load worker-node-default-img:latest
# repeat per worker type used in the task

# 2. Core services
cd infrastructure && docker compose up -d   # Redis, PostgreSQL

# 3. platform-api
cd platform-api && npm install && npm run start:dev

# 4. assignment-runner
cd assignment-runner && npm install && npm run start:dev

# 5. Frontend
cd front && npm install && npm run dev
```

`make up`, `make up-scheduler`, `make up-front` (see root `Makefile`) wrap
common subsets of this.

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
- The in-progress PostgreSQL-worker redesign → [postgresql-worker-harness spec](../../specs/postgresql-worker-harness.md)
