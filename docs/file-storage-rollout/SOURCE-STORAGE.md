# Source storage rollout

The chart runs the [File Storage API](https://github.com/COCSI-MG/eevee/blob/main/file-storage-api/README.md) as
the `source-storage` Deployment and Service. It is the only pod that mounts
the student-source PVC. The gateway serves browser sync at
`/storage`. For workspace submissions, the API validates the snapshot
manifest, PostgreSQL stores the submission reference, and the worker bootstrap
fetches and verifies that snapshot before grading.

## Deployment order

1. Back up the database before deploying. For an existing `source-storage`
   deployment, [include the source volume in the same checkpoint](https://github.com/COCSI-MG/eevee/blob/main/infrastructure/file-storage/BACKUP.md).
   Run the API migrations against the intended database from the updated checkout. The
   nullable `sourceSnapshotId` column on the `attempt` table is required before
   starting the updated API. Legacy `receivedWork` rows remain readable and
   can be regraded. This migration does not rewrite them.
2. Provision a dedicated, stable signing secret in the deployment namespace:

   ```bash
   kubectl -n eevee-cefetrj create secret generic eevee-source-storage \
     --from-literal=EEVEE_STORAGE_SIGNING_SECRET="$(openssl rand -hex 32)"
   ```

   Keep the same key on subsequent releases. The chart references the Secret;
   Helm does not generate, store in values, or rotate its contents. Existing
   deployments can use another Secret/key through `sourceStorage.secretName`
   and `sourceStorage.secretKey`.
3. Choose the server StorageClass and requested capacity before first creation.
   `sourceStorage.storageClass: null` uses the cluster default; `""` explicitly
   requests no class. The default capacity is 20 GiB. A network/CSI volume should
   provide the Linux filesystem flush semantics this store requires. Minikube's
   `standard` class is a local test configuration, not a production class choice.
4. Publish the standalone `ghcr.io/cocsi-mg/eevee-file-storage-api` image from
   `file-storage-api/Dockerfile`. Confirm the cluster's registry pull Secret
   can read the new package. If a live `source-storage` Deployment still uses
   the bundled Platform API image, roll storage to its standalone image before
   publishing a new Platform API image under the old tag.

   With `STORAGE_TAG` set to the published tag, the image-only handoff is:

   ```bash
   kubectl -n eevee-cefetrj set image deployment/source-storage \
     source-storage="ghcr.io/cocsi-mg/eevee-file-storage-api:$STORAGE_TAG"
   kubectl -n eevee-cefetrj rollout status deployment/source-storage --timeout=5m
   ```

   The handoff reuses the existing claim, mount path, and signing Secret.

   Publish the updated bootstrap to the image in `workerImages.bootstrap`
   before rolling out the app images. The default is
   `ghcr.io/cocsi-mg/eevee-worker-bootstrap:latest`. From the repository root,
   build and push the default image with:

   ```bash
   make build-eevee-worker-bootstrap
   make push-eevee-worker-bootstrap
   ```

   Build and publish the updated API, frontend and runner images.

   If upgrading from the storage sidecar, schedule a brief maintenance window.
   Scale the old Platform API deployment to zero and wait for its pods to exit
   before moving the existing claim to the standalone storage deployment. Use
   the same claim and source root. The release script rejects an active legacy
   sidecar so two processes cannot write the volume during handoff.

5. For the first release, pause preview and submission traffic and drain
   queued and active jobs before applying the chart. Deploy File Storage API,
   Platform API, and Assignment Runner together so they agree on the grant
   audience `eevee-file-storage-v1`. Resume traffic once they are ready and
   reload open workspaces to obtain new grants. Helm provisions the Service,
   Deployment, and PVC.
   After provisioning, the File Storage API workflow publishes its own image
   and rolls only `deployment/source-storage`. Shared Helm upgrades preserve
   its live image tag along with the other service image tags.

   From the intended production kube context, set `RELEASE_TAG` to the published
   tag for the three app images and `STORAGE_TAG` to the published storage tag.

   ```bash
   bash scripts/deploy-release.sh \
     --set-string platformApi.image.tag="$RELEASE_TAG" \
     --set-string front.image.tag="$RELEASE_TAG" \
     --set-string assignmentRunner.image.tag="$RELEASE_TAG" \
     --set-string sourceStorage.image.tag="$STORAGE_TAG"
   ```

   Test preview, submit, and regrade.

   Explicit values passed last still win, for example
   `--set sourceStorage.storageClass=<server-class>` or
   `--set sourceStorage.existingClaim=<existing-source-pvc>`. Preserve these
   choices in the committed chart values before future automated upgrades.

## PVC and process lifecycle

- The production chart creates `eevee-student-source`, mounts it at
  `/var/lib/eevee`, and writes source data under `/var/lib/eevee/source`.
- `existingClaim` reuses a pre-provisioned claim instead of rendering a PVC.
- The PVC defaults to `ReadWriteOnce` and `helm.sh/resource-policy: keep`.
  `keepPVCOnUninstall` controls that annotation. An uninstall leaves retained
  data behind; reinstall using `existingClaim` to reuse it deliberately.
- The storage Deployment uses one replica and `Recreate`. The API can scale
  independently and its readiness check does not include storage. The
  synchronous filesystem CAS protocol requires one storage process.
  See the Kubernetes documentation for [volume access modes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
  and [Recreate updates](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#recreate-deployment).
- Storage runs as UID/GID 1001 with a read-only root filesystem, and pod
  `fsGroup: 1001` provides access to the mounted claim. There is no privileged
  chmod/chown init container. The chosen provisioner must support those volume
  permissions; storage startup fails rather than acknowledging failed writes.
- Set `sourceStorage.httpLimits.workspaceBodyBytes` (64 KiB by default) and
  `sourceStorage.httpLimits.snapshotBodyBytes` (1 KiB by default) in Helm values
  to resize the JSON request limits with a Helm upgrade.
- Set `sourceStorage.limits.maxFileBytes` (1 MiB by default) and
  `sourceStorage.limits.maxProjectBytes` (5 MiB by default) to resize the
  quotas for new workspace saves. The gateway adjusts its request limit from
  the file and JSON limits with a 2 MiB minimum. Workspaces support up to 100
  UTF-8 files. Existing drafts and snapshots remain readable after lowering a
  quota. TLS remains at the existing external HTTPS entrypoint.
- The gateway uses the pod's Kubernetes DNS search suffix to resolve the
  storage Service at request time. Frontend, API and grading jobs use
  namespace-local Service names. API, frontend and gateway readiness checks
  keep traffic away during startup.

## Student behavior

After workspace reconciliation, edits, file additions, renames and removals
upload after 750 ms without further changes. Only changed blobs upload; a
workspace manifest commits the complete file set with a revision check.
Autosync does not create a submission or preview snapshot. Those actions remain
explicit and share the ordered write queue with autosync.

The editor shows whether the server save is pending, complete, or failed. Failed
writes retain browser IndexedDB work, retry on reconnect/new edits or the retry
button, and never silently overwrite a conflicting remote revision. A tab closed
before the server acknowledges a save can still have unsynced work; the UI must
not be interpreted as an offline backup guarantee. Separate tabs/devices need
explicit reconciliation on a conflict. Choosing the browser copy allows sync
against the server revision shown in the dialog. Dismissing the dialog leaves
the browser copy local until the conflict is resolved.

The API issues browser grants for the authenticated student and assignment.
The runner issues separate five-minute credentials restricted to one immutable
snapshot. Only the bootstrap receives that credential. It verifies the snapshot
and file hashes, then writes files into the existing per-job `emptyDir`.
Bootstrap retries temporary transfer failures before grading. Regrading uses
the stored submission ID even when the draft has changed.

For a rollback, keep source storage and the snapshot column available and use
API, runner and bootstrap versions that can read existing snapshot-backed
attempts and queued jobs.
Keep PostgreSQL and the source archive from the same checkpoint and verify a
restore before retiring legacy data.
