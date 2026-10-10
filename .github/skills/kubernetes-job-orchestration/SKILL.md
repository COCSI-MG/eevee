---
name: kubernetes-job-orchestration
description: "Understand or modify how Kubernetes Jobs/Pods are constructed and managed for worker execution. Use when touching assignment-runner/src/kubernetes/kubernetes.service.ts, kubernetes.interfaces.ts, kubernetes.constants.ts, Job volumes/mounts, activeDeadlineSeconds, TTL, or Job deletion logic."
---

# Kubernetes Job Orchestration (assignment-runner)

`assignment-runner/src/kubernetes/kubernetes.service.ts` wraps the
`kubernetes-client` `Client1_13` API and is the only place that talks to the
cluster. It builds Job specs from a `KubernetesJobOptions` object assembled by
a worker strategy (see
[worker-execution-strategies](../worker-execution-strategies/SKILL.md)).

## What it currently assembles

- `initContainers` (`buildInitContainers`) — bootstrap + optional
  Postgres/seed containers, each getting `imagePullPolicy`, `command`, `env`,
  and (if `sharedEmptyDir` set) volume mounts.
- `sharedEmptyDir` — a single `worker-app-volume` `emptyDir` mounted into
  every init/worker container that needs the student files.
- `configMap` volumes/mounts (`appendConfigMapVolumesAndMounts`).
- `secretVolumes` (`appendSecretVolumesAndMounts`), mounted read-only.
- Job existence checks (`checkIfJobExists`) against
  `DEFAULT_NAMESPACE` / `JOB_IMAGE_PULL_POLICY` /
  `JOB_IMAGE_PULL_SECRETS` / `JOB_NODE_SELECTOR` from
  `kubernetes.constants.ts`.

## Known gaps (as of the current harness redesign)

The service does **not** yet set, and needs to for database workers:

- `activeDeadlineSeconds` (Job-level execution deadline)
- `ttlSecondsAfterFinished` (auto-cleanup of finished Jobs/Pods)
- `backoffLimit: 0` / `restartPolicy: Never` (fail fast, no retries)
- `resources.requests` / `resources.limits` on the worker container
- A `deleteJobAndPods` path called from the runner's own application-level
  timeout (so Kubernetes cleanup and application cleanup stay in sync)

See the [postgresql-worker-harness spec](../../specs/postgresql-worker-harness.md)
for the concrete design and required field values — it documents a plan,
not yet-merged code.

## Working in this file

- Client picks in-cluster config (`config.getInCluster()`) when
  `KUBERNETES_SERVICE_HOST`/`PORT` env vars are present, otherwise falls back
  to the local kubeconfig (`config.fromKubeconfig()`) — this is how local dev
  against minikube works without extra config.
- Prefer adding new Job-shape concerns (deadlines, TTL, resources) as
  additional fields on `KubernetesJobOptions` in `kubernetes.interfaces.ts`,
  built by the strategy, rather than hardcoding them in the service — keeps
  worker-type-specific tuning out of the shared orchestration code.
