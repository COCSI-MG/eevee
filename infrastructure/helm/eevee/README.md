# EEVEE Helm chart

## Cluster diagnostics and worker node preference

The optional observer replaces the GitHub health cron. It samples pod CPU/memory,
node conditions/resources and API process metrics once per minute. A small canary
on each configured candidate node emits a harmless timestamp; the observer tests
the log route through the runner's in-cluster endpoint and any configured API
backends. It never reads student logs, patches node labels or modifies worker Jobs.

The runner uses fresh reports as **preferred node affinity**, not a mandatory
allowlist. With no trusted nodes, stale/missing/forbidden reports, or unavailable
preferred capacity, normal Kubernetes scheduling remains available. Diagnostics
never delay the execution queue solely because nodes are untrusted. Existing
operator-provided Job selectors and Kubernetes capacity/taints still apply.

Everything is disabled by default and has not been deployed by this change.
Prepare these values in the operator's existing release configuration:

```yaml
platformApi:
  metrics:
    enabled: true
    secretName: eevee-metrics # existing Secret, key: token; no committed token
assignmentRunner:
  nodeEligibility:
    enabled: true
    reportConfigMap: eevee-node-report
    maxAgeSeconds: 180
diagnostics:
  enabled: true
  candidateNodes: [YOUR_WORKER_NODE] # explicit observation/canary scope
  endpoints: [] # optionally: [{name: backend-name, url: https://API_HOST:PORT}]
  rbac:
    create: false # provision the dedicated observer SA/Role/Binding beforehand
    createClusterRole: false # cluster administrator must grant node/metrics-node reads
  persistence:
    existingClaim: YOUR_REPORTS_PVC # otherwise the chart creates a kept 1 GiB RWO PVC
```

The dedicated observer ServiceAccount needs get/list on namespace pods and
metrics.k8s.io pods, get on pods/log, get/patch on the named report ConfigMap,
and get/list on cluster nodes and metrics.k8s.io nodes. The template can create
these RBAC objects when the installing operator has those privileges. Namespace
admin alone may not. The runner only needs get on the report ConfigMap, already
included in the existing runner Role. Do not give the observer node-patch rights.

Supply the same existing metrics-token Secret to the API and observer. The port
9091 listener is separate from the public Service/gateway and has bearer auth;
the NetworkPolicy permits its ingress from observer pods. NetworkPolicy requires
an enforcing CNI. Backend URLs require the cluster CA and valid certificate SANs;
TLS verification remains enabled. The in-cluster path is always sampled.

Reports: `/reports/latest.json` and up to 1,440 `sample-<timestamp>.json` files on
the PVC. `eevee-node-report` holds only the expiring scheduling snapshot. Default
expiry is 180 seconds; three consecutive complete samples earn a stable
preference. A failed/unknown sample immediately removes that preference, without
evicting existing workers. A shared backend failure is not attributed to every node.
Missing/stale resource metrics stay unknown. Review the memory-fraction threshold
and sampling/retention budgets for the actual infrastructure; these are operator
settings, not measured service SLAs.

Sampling can miss short memory peaks and does not prove a leak is fixed. API
request/CPU/GC counters are cumulative within a process; compare by pod UID and
uptime. The GC sample is taken at callback delivery. The canary verifies log
access, not the complete submission/queue/worker/result cycle. The observer also
cannot report externally if the entire cluster is unreachable.

The deploy script resets values from Git; preserve approved observer settings in
the actual deployment configuration/caller arguments, not only in a prior Helm
release. Reconcile the dirty checkout with the current base before publishing.
See the [operational harness](../../../.github/specs/eevee-operational-harness.md)
for measured benchmark results and the pre-deployment production snapshot.

Umbrella chart that deploys the whole EEVEE platform onto Kubernetes in a
single release:

| Component         | Templates                                         |
| ----------------- | ------------------------------------------------- |
| Postgres          | Deployment + Service + PVC                        |
| Redis             | Deployment + Service                              |
| Platform API      | Deployment + Service                              |
| Assignment Runner | Deployment + RBAC (ServiceAccount/Role)           |
| Frontend          | Deployment + Service                              |
| Entrypoint        | Nginx gateway + NodePort Service                  |
| Ingress (nginx)   | Ingress with optional TLS                         |
| cert-manager      | Namespace-scoped `Issuer` (optional)              |
| Config / Secret   | `eevee-config` ConfigMap + `eevee-secrets` Secret |

This replaces the previous raw manifests under `k8s/` and the Kustomize
`overlays/prod` overlay.

## Operator workflow (shared cluster, namespace-scoped)

### CI configuration and image ownership

Before any deployment workflow builds or publishes application/worker images,
`validate-deployment.yaml` runs all three applications' unit tests and compilation,
checks the Helm chart and deployment script, and validates the jumpbox checkout,
required secrets, resource permissions, and a server-connected Helm dry run.
PostgreSQL worker publication also depends on this gate and its existing lifecycle
smoke tests. These checks do not guarantee application behavior under production
load or replace database migration planning.

Set **repository variable** `DEPLOY_WORKDIR=/home/eevee-cefetrj/eevee` (not an
Actions secret). The workflow fails with an explicit message if it is missing.
Rerunning an old Actions run uses its original commit; start a new run on updated
`main` to execute newly merged workflow fixes.

All four deployment workflows use `scripts/deploy-release.sh`. Each upgrade
resets Helm values and explicitly loads this chart's committed `values.yaml`.
Memory limits, Node options, and other configuration therefore come from Git;
old release values cannot silently override a configuration change. Move any
intentional production overrides into the committed values before deploying.

The script reads the three live application Deployments and preserves their
image repositories and tags, including images previously changed with kubectl.
The service workflow then overrides its own image with the newly built commit
SHA. Infrastructure-only changes preserve all three application images. Missing
Deployments use chart defaults on first install; failed Kubernetes reads abort.
Digest image references currently fail explicitly because the chart expects tags.

Chart changes trigger the infrastructure workflow automatically. All deployment
jobs share the production concurrency group. Secrets remain provisioned
out-of-band and are not recreated or rotated by an infrastructure deployment.

Run `bash scripts/test-deploy-release.sh` to check image preservation, override
precedence, first installs, and failure handling without accessing a cluster.

Secrets and the GHCR pull secret are **created out-of-band**. Helm only
references them by name and never manages their lifecycle (this avoids
Helm fighting an externally-edited Secret on `helm upgrade`).

```bash
NAMESPACE=eevee-cefetrj
RELEASE=eevee
CHART=infrastructure/helm/eevee
```

### 1. Create the GHCR image pull secret

The COCSI-MG packages are private; the cluster needs a docker-registry
secret to pull them. Paste your PAT directly into the terminal - do not
commit it.

```bash
kubectl -n $NAMESPACE create secret docker-registry ghcr-auth \
  --docker-server=ghcr.io \
  --docker-username=<your-github-user> \
  --docker-password=<classic-PAT-with-read:packages> \
  [email protected]
```

The secret name (`ghcr-auth`) must match `imagePullSecret.name` in
[values.yaml](values.yaml).

### 2. Create the application secret

```bash
kubectl -n $NAMESPACE create secret generic eevee-secrets \
  --from-literal=DB_PASSWORD="$(openssl rand -base64 24)" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 48)" \
  --from-literal=GROQ_API_KEY="<your-groq-key-or-empty>"
```

Key names must match exactly: `DB_PASSWORD`, `JWT_SECRET`, `GROQ_API_KEY`.
The secret name (`eevee-secrets`) must match `secrets.name` in values.

> **Rotating a secret:** edit it with `kubectl edit secret eevee-secrets`
> (or recreate it) and then `kubectl rollout restart deploy/platform-api-deployment deploy/assignment-runner-deployment` to pick up the new value.

### 3. Install / upgrade the release

```bash
helm upgrade --install $RELEASE $CHART -n $NAMESPACE
```

Or via Makefile from the repo root:

```bash
make helm-install
```

Verify:

```bash
kubectl -n $NAMESPACE get pods,svc,pvc
helm status $RELEASE -n $NAMESPACE
```

### 4. Access the app (single entrypoint)

`eevee-entrypoint-service` is exposed as NodePort (`30001`) and is the only
public entrypoint. It routes:

- `/` to `eevee-front-service`
- `/api/v1/*` to `platform-api-service`

For local access without a public VM, use only frontend port-forward:

```bash
kubectl -n $NAMESPACE port-forward svc/eevee-entrypoint-service 3000:80
```

Then open <http://localhost:3000> in your browser.

To expose frontend via NodePort on a specific port, set in values:

```yaml
entrypointGateway:
  enabled: true
  nodePort: 30001
```

### 5. VM reverse-proxy mode (recommended for the public machine)

This is the backup/high-availability setup when another machine with a fixed
public IP will forward traffic to this cluster's entrypoint NodePort.

1. Install/upgrade the cluster with:

```bash
make install
```

2. Start the backup SSH tunnel endpoint from this host (when needed):

```bash
make proxy
```

3. Point the public machine's reverse proxy at the SSH tunnel endpoint that
   forwards to local `127.0.0.1:30001`.

If you change the external setup, update:

- `entrypointGateway.nodePort`
- `proxy` / `proxy-db` Make targets as needed

## Node pinning

All pods - including worker Jobs spawned by Assignment Runner at runtime -
are pinned to a single node via `nodeSelector.kubernetes.io/hostname`
(default `whx-rn`). Change `nodeSelector` in values to retarget, or set
it to `{}` to schedule freely.

## Overriding worker images

Assignment Runner reads worker image names from environment variables,
so new image tags don't require a code change - just bump
`workerImages.*` in values and `helm upgrade`. Defaults point to the
COCSI-MG GHCR packages:

```yaml
workerImages:
  bootstrap: ghcr.io/cocsi-mg/eevee-worker-bootstrap:latest
  nodeDefault: ghcr.io/cocsi-mg/worker-node-default-img:latest
  # ...
  nodeTeraorm: ghcr.io/cocsi-mg/worker-node-teraorm-img:latest
  pythonDefault: ghcr.io/cocsi-mg/worker-python-default-img:latest
```

The RNP deployment uses the entrypoint gateway NodePort with ingress disabled.
This chart has no bundled ingress controller or external chart dependencies.
Enabling optional Ingress resources requires an externally managed controller.
