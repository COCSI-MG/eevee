# EEVEE Helm chart

Umbrella chart that deploys the whole EEVEE platform onto Kubernetes in a
single release:

| Component       | Templates                               |
| --------------- | --------------------------------------- |
| Postgres        | Deployment + Service + PVC              |
| Redis           | Deployment + Service                    |
| Scheduler API   | Deployment + Service                    |
| Queue Worker    | Deployment + RBAC (ServiceAccount/Role) |
| Frontend        | Deployment + Service                    |
| Ingress (nginx) | Ingress with optional TLS               |
| cert-manager    | Namespace-scoped `Issuer` (optional)    |
| Config / Secret | `eevee-config` ConfigMap + `eevee-secrets` Secret |

This replaces the previous raw manifests under `k8s/` and the Kustomize
`overlays/prod` overlay.

## Operator workflow (shared cluster, namespace-scoped)

Secrets and the GHCR pull secret are **created out-of-band**. Helm only
references them by name and never manages their lifecycle (this avoids
Helm fighting an externally-edited Secret on `helm upgrade`).

```bash
NAMESPACE=eevee-cefetrj
RELEASE=eevee
CHART=eevee-infrastructure/helm/eevee
```

### 1. Create the GHCR image pull secret

The COCSI-MG packages are private; the cluster needs a docker-registry
secret to pull them. Paste your PAT directly into the terminal — do not
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
> (or recreate it) and then `kubectl rollout restart deploy/scheduler-api-deployment deploy/queue-worker-deployment` to pick up the new value.

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

### 4. Access the apps (port-forward mode)

No Ingress is provisioned by default (`ingress.enabled=false`) because no
public DNS / external IP has been assigned yet. Use port-forward:

```bash
# Frontend
kubectl -n $NAMESPACE port-forward svc/eevee-front-service 3000:3000
# Scheduler API (in another terminal)
kubectl -n $NAMESPACE port-forward svc/scheduler-api-service 3001:3000
```

Then open <http://localhost:3000> in your browser.

To expose via Ingress once a real domain is available, set in values:

```yaml
ingress:
  enabled: true
  hosts:
    api: api.eevee.example.org
    front: app.eevee.example.org
```

### 5. VM ingress-controller mode (recommended for the public machine)

This is the proper setup when another machine with a fixed public IP will
forward traffic to the Kubernetes ingress controller.

1. Install/upgrade with:

```bash
make install-vm
```

2. Point the public machine's reverse proxy at the ingress controller, not at
  the frontend or scheduler-api pods directly.

If you change the public hostnames, update the inline overrides in the
Makefile target:

- `ingress.hosts.front` / `ingress.hosts.api`
- `front.apiUrl`

If the browser is served from a different origin, also adjust
`config.CORS_ALLOWED_ORIGINS` so the scheduler API accepts those requests.

## Node pinning

All pods — including worker Jobs spawned by the scheduler at runtime —
are pinned to a single node via `nodeSelector.kubernetes.io/hostname`
(default `whx-rn`). Change `nodeSelector` in values to retarget, or set
it to `{}` to schedule freely.

## Overriding worker images

The scheduler-api reads worker image names from environment variables,
so new image tags don't require a code change — just bump
`workerImages.*` in values and `helm upgrade`. Defaults point to the
COCSI-MG GHCR packages:

```yaml
workerImages:
  bootstrap: ghcr.io/cocsi-mg/eevee-worker-bootstrap:latest
  nodeDefault: ghcr.io/cocsi-mg/worker-node-default-img:latest
  # ...
  nodeTeraorm: ghcr.io/cocsi-mg/worker-node-teraorm-img:latest
```
