# Back up and restore student source storage

Keep one checkpoint per backup. It contains a verified source archive from the
PVC and a PostgreSQL dump from the same maintenance window. PostgreSQL contains
the attempt records and snapshot IDs. The PVC contains the draft files and
snapshot contents. Keep both files together on encrypted storage outside the
cluster because they contain student data.

## Prepare a maintenance window

Use Bash with `kubectl`, `tar`, `sha256sum`, and PostgreSQL client tools matching
the server's major version. On Windows, run these commands with Linux tools in WSL. Replace
`KUBE_CONTEXT` with the approved production context and confirm the database and
deployments before continuing. Run the blocks in order and stop if a command fails.

```bash
set -euo pipefail
KUBE_CONTEXT=replace-with-production-context
NAMESPACE=eevee-cefetrj
k=(kubectl --context "$KUBE_CONTEXT" --namespace "$NAMESPACE")

"${k[@]}" get deployment source-storage platform-api-deployment assignment-runner-deployment
"${k[@]}" get configmap eevee-config -o jsonpath='{.data.DB_HOST}{"\n"}{.data.DB_DATABASE}{"\n"}'
CLAIM=$("${k[@]}" get deployment source-storage -o jsonpath='{.spec.template.spec.volumes[?(@.name=="student-source")].persistentVolumeClaim.claimName}')
IMAGE=$("${k[@]}" get deployment source-storage -o jsonpath='{.spec.template.spec.containers[?(@.name=="source-storage")].image}')
"${k[@]}" get pvc "$CLAIM"

umask 077
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
DEST="./eevee-checkpoint-$STAMP"
mkdir "$DEST"
POD="source-storage-backup-${STAMP,,}"
"${k[@]}" get deployment source-storage platform-api-deployment assignment-runner-deployment \
  --no-headers -o 'custom-columns=NAME:.metadata.name,REPLICAS:.spec.replicas' > "$DEST/replicas.txt"
cat "$DEST/replicas.txt"
```

Pause automated deploys and put the app in maintenance so new submissions stop.
Drain queued and running grading jobs and pause any other writers to the database
or source volume. Keep writes paused until both copies complete. This pairs the
database snapshot with the files it references.

```bash
"${k[@]}" scale deployment/platform-api-deployment deployment/assignment-runner-deployment \
  deployment/source-storage --replicas=0
"${k[@]}" get pods -l 'app in (platform-api,assignment-runner,source-storage)'
```

Repeat the pod check until the matching pods have exited. The maintenance pod
must be the only user of the source claim during backup.

## Copy the source volume and database

This maintenance pod uses the deployed File Storage API image and mounts the
source PVC read-only.
It stages the archive on node disk. Confirm enough space for a full copy of the
source data. The example uses the chart's `ghcr-auth` image pull secret. If your
deployment overrides the pull secret or scheduling constraints, match them here.

```bash
start_storage_maintenance_pod() {
  local pod="$1" claim="$2" read_only="$3"
  "${k[@]}" create -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: $pod
spec:
  restartPolicy: Never
  automountServiceAccountToken: false
  imagePullSecrets:
    - name: ghcr-auth
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    runAsGroup: 1001
    fsGroup: 1001
  containers:
    - name: maintenance
      image: "$IMAGE"
      command: [node, -e, 'setInterval(() => {}, 60000)']
      securityContext:
        readOnlyRootFilesystem: true
        allowPrivilegeEscalation: false
        capabilities:
          drop: [ALL]
      volumeMounts:
        - name: source
          mountPath: /var/lib/eevee
          readOnly: $read_only
        - name: scratch
          mountPath: /scratch
  volumes:
    - name: source
      persistentVolumeClaim:
        claimName: $claim
        readOnly: $read_only
    - name: scratch
      emptyDir: {}
EOF
  "${k[@]}" wait --for=condition=Ready "pod/$pod" --timeout=5m
}

start_storage_maintenance_pod "$POD" "$CLAIM" true
"${k[@]}" exec "$POD" -- node /usr/app/source-storage/dist/backup.js \
  backup /var/lib/eevee/source /scratch/checkpoint
"${k[@]}" exec "$POD" -- tar -C /scratch -cf - checkpoint > "$DEST/source.tar"
tar -tf "$DEST/source.tar" > "$DEST/source-files.txt"
```

With the chart's PostgreSQL deployment, dump the configured database while the
app is still in maintenance. For an external database, use `pg_dump --format=custom`
against that database with your normal credentials and write the same output file.

```bash
"${k[@]}" exec deployment/postgres-deployment -c postgres -- sh -ec \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump --format=custom --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
  > "$DEST/postgres.dump"
pg_restore --list "$DEST/postgres.dump" > "$DEST/postgres-objects.txt"
(cd "$DEST" && sha256sum source.tar postgres.dump > SHA256SUMS)
```

Delete the temporary pod after both files are on your workstation. Restore each
deployment to the replica count in `replicas.txt` and wait for its rollout before
reopening traffic and resuming deploys. If the backup fails, remove the maintenance
pod and resume the same workloads. Treat incomplete copies as a failed checkpoint.

```bash
"${k[@]}" delete pod "$POD" --ignore-not-found --wait=true --timeout=5m
while read -r deployment replicas; do
  "${k[@]}" scale "deployment/$deployment" --replicas="$replicas"
done < "$DEST/replicas.txt"
while read -r deployment replicas; do
  if [ "$replicas" -gt 0 ]; then
    "${k[@]}" rollout status "deployment/$deployment" --timeout=10m
  fi
done < "$DEST/replicas.txt"
```

## Restore to an isolated environment

1. Run `(cd "$DEST" && sha256sum -c SHA256SUMS)` on the saved checkpoint. Prepare
   a fresh PVC and an empty PostgreSQL database with the required roles and
   extensions. Use an isolated namespace and database for the drill.
2. Set `k` to that namespace and context. Set `IMAGE` to the compatible image,
   `RESTORE_POD` to a new pod name, and `RESTORE_CLAIM` to the fresh PVC. Use the
   same maintenance pod function with a writable mount. Allow scratch space for
   the archive and its extracted files. `kubectl cp` uses the image's `tar`.

   ```bash
   start_storage_maintenance_pod "$RESTORE_POD" "$RESTORE_CLAIM" false
   "${k[@]}" cp "$DEST/source.tar" "$RESTORE_POD:/scratch/source.tar"
   "${k[@]}" exec "$RESTORE_POD" -- tar -C /scratch -xf /scratch/source.tar
   "${k[@]}" exec "$RESTORE_POD" -- node /usr/app/source-storage/dist/backup.js \
     restore /scratch/checkpoint /var/lib/eevee/source
   "${k[@]}" delete pod "$RESTORE_POD" --wait=true
   ```

   The CLI verifies the archive's file hashes and snapshot references before
   publishing the restored directory. The destination `source/` must be absent.
3. Set `RECOVERY_DATABASE_URL` to the isolated database and restore the paired dump.

   ```bash
   pg_restore --exit-on-error --single-transaction \
     --dbname="$RECOVERY_DATABASE_URL" "$DEST/postgres.dump"
   ```

4. Point the recovery deployment at the restored claim using
   `sourceStorage.existingClaim` and at the restored database. Start compatible
   app and worker images. Verify that an existing draft opens and a known
   snapshot-backed submission can be regraded before using the checkpoint for
   a production recovery.

See the [Kubernetes file copy reference](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_cp/)
and the PostgreSQL [dump](https://www.postgresql.org/docs/16/app-pgdump.html)
and [restore](https://www.postgresql.org/docs/16/app-pgrestore.html) references.
