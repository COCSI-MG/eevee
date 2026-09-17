# PostgreSQL workers

The shared Dockerfile builds the Node-default and NestJS database workers with
Node 22 and PostgreSQL 16. The entrypoint initializes a fresh database under
`/tmp`, waits at most 30 seconds for startup, optionally executes a SQL file
with `ON_ERROR_STOP`, runs the existing trigger, and stops PostgreSQL on exit
or cancellation. The trigger's exit status is preserved. Connections use
`localhost:5432`, database `eevee`, user/password `postgres`/`postgres`.

Kubernetes runs only the existing bootstrap init container and one worker.
The strategy explicitly invokes the entrypoint because Kubernetes `command`
overrides Docker's entrypoint. Optional SQL is carried in a Job-owned ConfigMap
and copied by bootstrap into `/app/test/.eevee-init.sql` on the shared volume;
neither shell source nor an environment variable contains SQL. ConfigMaps
have a 1 MiB size limit. Job ownership removes the seed when the Job is deleted.

Jobs have a 210-second deadline and a 900-second finished-Job TTL. The runner
retains its 200-second application timeout and awaits Job/Pod deletion before
rejecting. The shorter deadline (instead of the spec's proposed 600 seconds)
keeps the existing application timeout just ahead of the Kubernetes fallback.
Database workers request 100m CPU/256Mi memory and have limits of 1 CPU/768Mi.

## Build and test

From the repository root:

```sh
docker build --build-arg WORKER=node-default -f images/node/postgresql/Dockerfile -t eevee-postgresql-node:test .
docker build --build-arg WORKER=nest.js -f images/node/postgresql/Dockerfile -t eevee-postgresql-nest:test .
python images/node/postgresql/smoke.py eevee-postgresql-node:test
python images/node/postgresql/smoke.py eevee-postgresql-nest:test
```

The smoke tests exercise a seeded database through each real Node trigger,
nonzero worker status, invalid SQL, and graceful cancellation of an HTTP server.
Runner unit tests cover generated Job manifests, large SQL transport, seed
ownership/failure cleanup, application timeout cleanup, and timely log collection.

## Publish and roll out

The Assignment Runner deployment workflow first builds, tests, and publishes
both database images under the full commit SHA. Only then does it update the
runner and both image environment variables together. It also grants its
configured service account the ConfigMap and Pod-deletion permissions needed
for seeding and cancellation. No existing stuck Jobs are removed by deployment.

For a Helm installation, publish first and supply the resulting immutable tags:

```sh
make build-worker-node-default-postgresql build-worker-nestjs-postgresql TAG=<commit-sha>
make push-worker-node-default-postgresql push-worker-nestjs-postgresql TAG=<commit-sha>
helm upgrade --install eevee infrastructure/helm/eevee --namespace eevee-cefetrj \
  --set-string workerImages.nodeDefaultPostgresql=ghcr.io/cocsi-mg/worker-node-default-postgresql-img:<commit-sha> \
  --set-string workerImages.nodeNestjsPostgresql=ghcr.io/cocsi-mg/worker-nestjs-postgresql-img:<commit-sha>
```

Both `pg-harness-v1` release images were published on 2026-09-17. The Helm
defaults pin their manifests by digest, and the registry manifests were checked
against the locally tested images. Do not overwrite a released tag. Upgrade
Helm RBAC before rolling out a runner outside the automated deployment workflow.

## Minikube integration suite

After building the images above and the runner, run:

```sh
docker build -t eevee-worker-bootstrap:pg-harness-test images/worker-bootstrap
minikube image load eevee-postgresql-node:test eevee-postgresql-nest:test eevee-worker-bootstrap:pg-harness-test
cd assignment-runner
npm run build
node scripts/test-postgresql-minikube.cjs
```

The suite explicitly targets the `minikube` context and creates a fresh
namespace, deleted afterward. It uses the real runner service and strategies,
including the full 200-second application timeout and 210-second Kubernetes
deadline. It asserts the default 900-second TTL and overrides it to 15 seconds
for the cleanup checks. Results and diagnostic logs are written under
`assignment-runner/test-results/`.

The Minikube suite covers these cluster-level checks:

1. Submit seeded and unseeded assignments for both worker types; inspect the
   Pod for exactly one init container named `eevee-worker-bootstrap`.
2. Submit invalid SQL; confirm failure and collect the worker logs.
3. Run an HTTP server that stays open without the runner waiting; confirm the
   Job fails with `DeadlineExceeded` after 210 seconds.
4. Confirm finished Jobs, Pods, and seed ConfigMaps disappear after the TTL.
   Legacy clusters must have the TTL controller enabled for automatic cleanup.
5. Cancel an active assignment and confirm both Job and Pod disappear.
6. Confirm logs reach the runner before TTL expiry; watch Job age and memory.

Validation on Minikube (Kubernetes 1.31.0, 2026-09-17) passed seeded and unseeded
assignments for both worker types, invalid SQL, active cancellation, Pod layout,
log collection, and TTL cleanup of Jobs, Pods, and seed ConfigMaps. The real
application timeout returned after cleanup at approximately 204 seconds;
Kubernetes independently reported `DeadlineExceeded` at approximately 211
seconds. TTL behavior was exercised at 15 seconds while asserting the generated
production default of 900 seconds. This does not verify TTL-controller support
on a different legacy production cluster.

Preserve the prior runner image and image environment values together for
rollback. This validation did not deploy the runner to production.
