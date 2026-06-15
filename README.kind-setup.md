# EEVEE — Educational Exercises and Video-based E-learning Environment

EEVEE is a microservices-based platform for running graded programming exercises in isolated Kubernetes pods. Students write code in a browser IDE, submissions are queued via BullMQ, and a per-language "worker" pod executes their code and reports back a score.

This README is the **local setup using [kind](https://kind.sigs.k8s.io/)** (the legacy minikube flow is no longer supported).

---

## Architecture

- **`front/`** — Next.js 15 UI (port `3001`).
- **`scheduler-api/`** — NestJS HTTP API (port `3010`, prefix `/v1`) + a separate NestJS process that consumes the BullMQ queue and creates K8s Jobs.
- **`node-worker-images/`** — Container images for each `WorkerType`: `node`, `nest.js`, `grpc`, `next.js-cypress`, `reactjs-cypress`, `node-teraorm`, plus the shared `worker-bootstrap` init container.
- **`eevee-infrastructure/`** — `docker compose` for Postgres + Redis + (optional) Kafka.

Submission flow:

```
front → POST /v1/scheduling → DB row (attempt: pending)
                            → BullMQ "scheduling-queue"
                            ↓
                       start:worker:dev process
                            ↓
                       creates K8s Job "attempt-N-worker"
                            ↓
                       bootstrap init copies student files into /app
                            ↓
                       main container runs `npm start` → jest → logs parsed → DB updated
```

---

## 0. Prerequisites

| Tool        | Required version                           |
| ----------- | ------------------------------------------ |
| Docker      | latest, user in the `docker` group         |
| kind        | latest                                     |
| kubectl     | latest                                     |
| Node.js     | **22** (via nvm — system Node 18 is too old) |
| gcloud (opt)| only if you regenerate the BigQuery SA key |

```bash
node -v
# if not v22:
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm install 22 && nvm use 22
```

If your shell isn't in the `docker` group yet, prefix docker/kind/kubectl calls with `sg docker -c "<cmd>"`. The rest of this README assumes that prefix where needed.

---

## 1. Create the kind cluster

```bash
sg docker -c "kind create cluster --name eevee"
sg docker -c "kubectl config use-context kind-eevee"
sg docker -c "kubectl get nodes"
```

If the control-plane container ever stops between sessions:

```bash
sg docker -c "docker start eevee-control-plane"
```

---

## 2. Start Postgres + Redis

These run as host containers, not inside the kind cluster:

```bash
cd eevee-infrastructure
sg docker -c "docker compose up -d"
sg docker -c "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep eevee"
```

Expected:

- `eevee-scheduler-database` — Postgres 16, host port **5433**
- `eevee-scheduler-redis` — Redis 8, host port **6379**

---

## 3. Build worker images and load them into kind

`kind` does **not** see your local Docker image cache — every rebuilt image must be loaded explicitly.

```bash
cd node-worker-images

# Bootstrap init container (required by EVERY worker)
( cd worker-bootstrap && sg docker -c "docker build -t eevee-worker-bootstrap:latest ." )
sg docker -c "kind load docker-image eevee-worker-bootstrap:latest --name eevee"

# Default Node worker
( cd node && sg docker -c "docker build -t worker-node-default-img:latest ." )
sg docker -c "kind load docker-image worker-node-default-img:latest --name eevee"

# TeraORM worker (BigQuery AB study)
( cd node-teraorm && sg docker -c "docker build -t worker-node-teraorm-img:latest ." )
sg docker -c "kind load docker-image worker-node-teraorm-img:latest --name eevee"
```

Add `nest.js`, `grpc`, `next.js-cypress`, `reactjs-cypress` the same way only if you intend to exercise those `WorkerType`s.

---

## 4. (TeraORM only) BigQuery credentials secret

The `NODE_TERAORM` worker mounts a GCP service-account key as `/var/run/gcp/sa.json`. The key file lives at `secrets/teraorm-survey-28203d366900.json` (not committed).

```bash
cd /path/to/eevee
sg docker -c "kubectl create secret generic eevee-bq-credentials \
  --from-file=sa.json=$PWD/secrets/teraorm-survey-28203d366900.json \
  --dry-run=client -o yaml | kubectl apply -f -"

sg docker -c "kubectl get secret eevee-bq-credentials"
```

Skip this step if you're not running the AB study.

---

## 5. Configure & prepare `scheduler-api`

Create `scheduler-api/.env`:

```env
# Postgres (matches docker-compose)
PG_HOST=localhost
PG_PORT=5433
PG_USERNAME=eevee_user
PG_PASSWORD=eevee_password
PG_DATABASE=eevee_db

# Redis (matches docker-compose)
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka (only if file-saver is enabled)
KAFKA_BROKER=localhost:9092

# JWT — generate with: npm run script:generate-jwt-key
JWT_SECRET=...

# BigQuery (only for NODE_TERAORM)
WORKER_GOOGLE_CLOUD_PROJECT=teraorm-survey
```

Install, migrate, seed:

```bash
cd scheduler-api
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22

npm install
npm run migration:run

# Users: admin@example.com / admin123  and  student@example.com / student123
npm run seed

# TeraORM AB study class + 4 paired exercises with per-exercise interview questions
npm run seed:teraorm-study
```

---

## 6. Run the scheduler — **two processes are required**

The HTTP API and the BullMQ queue consumer are separate Nest applications. Running only the HTTP API means submissions enqueue successfully but **no K8s Job is ever created** — attempts will sit stuck at `pending`.

### Terminal A — HTTP API (`:3010`)

```bash
cd scheduler-api && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22
npm run start:dev
```

### Terminal B — Queue consumer

```bash
cd scheduler-api && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22
npm run start:worker:dev
```

Or use `make up-scheduler` if you prefer the Makefile shortcut.

---

## 7. Run the frontend

`front/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3010/v1
```

```bash
cd front && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22
npm install
npm run dev      # http://localhost:3001
```

Default logins:

| Role    | Email                  | Password    |
| ------- | ---------------------- | ----------- |
| Admin   | `admin@example.com`    | `admin123`  |
| Student | `student@example.com`  | `student123`|

---

## 8. Sanity checks

```bash
# API alive + auth works
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3010/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}'
# expect: 201

# Cluster reachable on the right context
sg docker -c "kubectl config current-context"   # → kind-eevee
sg docker -c "kubectl get nodes"

# After submitting an attempt from the UI, watch the worker spawn:
sg docker -c "kubectl get jobs,pods -n default | grep attempt-"
```

---

## TeraORM AB Study Module

Seed (`npm run seed:teraorm-study`) creates one class — **TeraORM AB Validation Module** — with 4 paired exercises:

- `AB01-A SDK Native: Revenue by Store`
- `AB01-B TeraORM: Revenue by Store`
- `AB02-A SDK Native: Top Customers by Region`
- `AB02-B TeraORM: Top Customers by Region`

Each exercise runs against **real BigQuery** (dataset `eevee_ab_validation`, ephemeral 1h-expiring tables). Each one ships with two contextual interview questions (clarity 1–5 + open-ended difficulty) stored on `assignment.interviewConfig`. Once a student has at least one accepted attempt on **every** assignment in the class, the full comparative questionnaire (SDK vs ORM Likerts + preference) appears on the same interview page.

---

## Adding a new worker type

1. Add the enum value in [`scheduler-api/src/worker/enum/worker-type.enum.ts`](scheduler-api/src/worker/enum/worker-type.enum.ts).
2. Register the image in [`scheduler-api/src/worker/worker.constants.ts`](scheduler-api/src/worker/worker.constants.ts) (`WORKER_JOB_PREFIX` and `WORKER_IMAGE_NAMES`).
3. Create a strategy under `scheduler-api/src/worker/strategies/`, extending `BootstrapInitContainerStrategy`, and register it in `WorkerService.strategyByWorkerType`.
4. Create a Dockerfile under `node-worker-images/<your-type>/`, build it, and `kind load` it into the cluster.
5. Write a TypeORM migration that does `ALTER TYPE assignment_workertype_enum ADD VALUE ...` (and the matching `template_workertype_enum`).
6. Mirror the enum in the frontend: [`front/src/app/interface/scheduler-api/worker.ts`](front/src/app/interface/scheduler-api/worker.ts), plus the maps in [`front/src/app/admin/assignments/constants.ts`](front/src/app/admin/assignments/constants.ts) and [`front/src/app/admin/templates/constants.ts`](front/src/app/admin/templates/constants.ts).

---

## Common gotchas

| Symptom | Cause / Fix |
| --- | --- |
| Attempt is stuck `pending`, UI shows "Em execução" forever | `npm run start:worker:dev` (Terminal B) isn't running. Start it — BullMQ picks up waiting jobs immediately. |
| Worker pod `ImagePullBackOff` | Image not loaded into kind after rebuild. Re-run `kind load docker-image <name> --name eevee`. |
| `kubectl` shows the wrong cluster | `sg docker -c "kubectl config use-context kind-eevee"`. |
| Migration error about `assignment_workertype_enum` not having a value | Run `npm run migration:run` **before** `npm run seed:teraorm-study`. |
| Postgres connection refused on `:5433` | `docker compose up -d` in `eevee-infrastructure/` wasn't run, or the container is stopped. |
| `redis: getaddrinfo ENOTFOUND` from scheduler-api | `REDIS_HOST`/`REDIS_PORT` missing from `.env`. |
| BQ worker logs `Permission denied` | The `teraorm-survey` SA needs `roles/bigquery.dataEditor` + `roles/bigquery.jobUser` on the project (or dataset-scoped on `eevee_ab_validation`). |
| Kind control-plane container disappeared after reboot | `sg docker -c "docker start eevee-control-plane"`, then re-load every worker image. |

---

## Useful commands

```bash
# Tests
cd scheduler-api && npm run test          # unit
cd scheduler-api && npm run test:e2e      # e2e
cd scheduler-api && npm run test:cov      # coverage

# DB migrations
cd scheduler-api && npm run migration:generate -n DescriptiveName
cd scheduler-api && npm run migration:run

# Frontend lint
cd front && npm run lint

# Inspect queue state
sg docker -c "docker exec eevee-scheduler-redis redis-cli KEYS 'bull:scheduling-queue:*'"
sg docker -c "docker exec eevee-scheduler-redis redis-cli LRANGE 'bull:scheduling-queue:wait' 0 -1"

# Inspect worker logs
sg docker -c "kubectl logs job/attempt-<N>-worker"
```

---

## Reference

- Swagger UI: <http://localhost:3010/api> (auto-generated from `@ApiOperation()`).
- Architecture diagram: `eevee-c4-architectural-view-v2.drawio`.
- Per-module READMEs: `scheduler-api/README.md`, `front/README.md`, `node-worker-images/<type>/README.md`, `eevee-infrastructure/README.md`.
