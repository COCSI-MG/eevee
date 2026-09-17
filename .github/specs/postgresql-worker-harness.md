# Spec: PostgreSQL workers on legacy Kubernetes

## Status

This is a design harness only. No production code, image, Job manifest, or
runtime configuration is enabled by this document. The implementation snippets
are deliberately commented out so that a follow-up agent can apply and test
them in an environment that can build Node and container images.

## Why the current design cannot work

The legacy cluster does not retain `initContainers[].restartPolicy: Always` in
the live Pod specification. `postgres-db` (see
`assignment-runner/src/worker/strategies/postgresql-container.strategy.ts`) is
therefore an ordinary init container. It is a database server and does not
exit, so Kubernetes never starts `seed-database` or the worker container.

Do not replace it with a regular Pod sidecar. A Job waits for all regular
containers to exit; a PostgreSQL sidecar would then keep the Job active after
the tests finish unless the worker implements fragile peer-termination logic.

## Target design

Create one database-capable image for each database worker type. Its entrypoint
owns the full temporary database lifecycle, then executes the existing Node
test trigger. Kubernetes sees one long-lived worker process and can mark the
Job complete when it exits.

```text
bootstrap init container (writes files) -> database worker container
                                          start PostgreSQL
                                          wait up to 30 seconds
                                          apply optional SQL
                                          run Node test trigger
                                          stop PostgreSQL
                                          exit with trigger status
```

The worker container needs PostgreSQL server and client binaries as well as the
current Node worker runtime. Keep database data under `/tmp`; it is ephemeral
and must never use the shared application volume.

## Files to change

1. Add a Dockerfile and lifecycle entrypoint for each PostgreSQL worker image.
   Start with `images/node/node-default/` and `images/node/nest.js/`, or make a
   shared base image if that keeps the build pipeline simpler.
2. Update the database strategies in
   `assignment-runner/src/worker/strategies/postgresql-container.strategy.ts`.
   They should stop adding `postgres-db` and `seed-database` init containers.
3. Add Job execution deadline, finished-Job TTL, and resource requirements in
   `assignment-runner/src/kubernetes/kubernetes.service.ts`.
4. On the runner's 200-second application timeout, delete the Job before
   returning an error.
5. Update the affected worker-image environment variables in Helm and publish
   the new image tags.

## Commented entrypoint contract

The final script must be made executable by the Docker build. The following is
an intentionally disabled implementation outline, not a script to run as-is:

```bash
# #!/usr/bin/env bash
# set -Eeuo pipefail
#
# pg_data=/tmp/eevee-postgres-data
# pg_log=/tmp/eevee-postgres.log
# worker_status=1
#
# stop_postgres() {
#   pg_ctl -D "$pg_data" -m fast -w stop >/dev/null 2>&1 || true
# }
# trap 'stop_postgres; exit 143' TERM INT
# trap 'stop_postgres' EXIT
#
# initdb -D "$pg_data" --username=postgres --auth-local=trust
# pg_ctl -D "$pg_data" -o '-c listen_addresses=localhost' -w start
#
# for attempt in $(seq 1 30); do
#   pg_isready -h localhost -p 5432 -U postgres && break
#   sleep 1
# done
# pg_isready -h localhost -p 5432 -U postgres \
#   || { echo 'PostgreSQL was not ready within 30 seconds'; exit 1; }
#
# createdb -h localhost -U postgres eevee
# if [[ -n "${EEVEE_INIT_SQL_FILE:-}" ]]; then
#   psql -v ON_ERROR_STOP=1 -h localhost -U postgres -d eevee \
#     -f "$EEVEE_INIT_SQL_FILE"
# fi
#
# npm start &
# worker_pid=$!
# wait "$worker_pid" || worker_status=$?
# exit "$worker_status"
```

The implementation should pass SQL through a file in the existing shared
volume, not interpolate it into a shell command or environment variable. That
avoids quoting errors and command/environment size limits.

## Commented Job contract

The final generated Job should contain only the bootstrap init container and a
single regular worker container for the database worker. The following fields
are required in the generated `spec`; values are proposals to validate against
real execution durations:

```yaml
# spec:
#   activeDeadlineSeconds: 600
#   ttlSecondsAfterFinished: 900
#   backoffLimit: 0
#   template:
#     spec:
#       restartPolicy: Never
#       initContainers:
#         - name: eevee-worker-bootstrap
#           # No postgres-db or seed-database here.
#       containers:
#         - name: <job-name>
#           resources:
#             requests:
#               cpu: 100m
#               memory: 256Mi
#             limits:
#               cpu: "1"
#               memory: 768Mi
```

The application wait timeout should be slightly shorter than
`activeDeadlineSeconds`, and its timeout handler must call `deleteJobAndPods`.
This leaves Kubernetes as the final safety net if the runner crashes.

## Required tests in a build-capable environment

1. Build each new worker image and run a passing database-backed test.
2. Run a failing SQL seed and verify that the Job fails and its Postgres process
   exits.
3. Run a test that leaves an HTTP server open; verify that
   `activeDeadlineSeconds` ends the Job.
4. Confirm a finished Job and its pod disappear after the TTL.
5. Cancel an active Job and verify both the Job and Pod are deleted.
6. Inspect the created Pod: it must have no `postgres-db` or `seed-database`
   init containers.
7. Verify logs are collected before the Job TTL expires.

## Rollout and recovery

Deploy the new runner only after its worker images are published and their
environment variables reference immutable tags. Existing stuck Jobs are not
fixed by deployment; an authorized cluster owner must review and remove those
separately. Observe Job age, active count, and worker memory after rollout.
