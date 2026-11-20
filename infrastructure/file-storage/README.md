# Student source storage

The [File Storage API](../../file-storage-api/README.md) contains the HTTP
server, storage engine, backup CLI, tests, and Dockerfile. This directory
contains the [local launcher](./start-local.cjs), the
[Minikube Deployment and Service](./minikube.yaml), and the
[local claim manifest](./minikube-pvc.yaml).

With Minikube running, `make up-file-storage-api` provisions any missing
resources, waits for the service, and opens the local port-forward. The
Deployment mounts the compiled JavaScript from a ConfigMap and stores data under
`/data/source` on the `eevee-student-source` claim. See the
[local development guide](../../docs/local-development.md#iniciar-a-file-storage-api).

The [production rollout guide](../../docs/file-storage-rollout/SOURCE-STORAGE.md)
covers how Helm provisions the [claim](../helm/eevee/templates/source-storage-pvc.yaml)
and mounts it in the [storage Deployment](../helm/eevee/templates/source-storage.yaml).

For manual export to your workstation and recovery, follow the
[backup and restore runbook](./BACKUP.md).
