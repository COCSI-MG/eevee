#!/usr/bin/env bash
set -euo pipefail

# Configuration comes from Git, never from an older Helm release. Preserve only
# the live app image references (including images deployed by legacy kubectl jobs).
CHART=${CHART:-infrastructure/helm/eevee}
NAMESPACE=${NAMESPACE:-eevee-cefetrj}
RELEASE=${RELEASE:-eevee}
image_args=()
legacy_writer=$(kubectl -n "$NAMESPACE" get deployment platform-api-deployment --ignore-not-found \
  -o "jsonpath={.spec.replicas}{.spec.template.spec.containers[?(@.name=='source-storage')].name}")
legacy_pods=$(kubectl -n "$NAMESPACE" get pods -l app=platform-api \
  -o "jsonpath={range .items[*]}{.spec.containers[?(@.name=='source-storage')].name}{end}")
if [[ "$legacy_writer" == *source-storage && "$legacy_writer" != 0source-storage ]] || [[ -n "$legacy_pods" ]]; then
  echo 'Stop the legacy source-storage sidecar before moving its PVC to the dedicated Deployment.' >&2
  exit 1
fi
for mapping in \
  platformApi:platform-api-deployment:platform-api \
  assignmentRunner:assignment-runner-deployment:assignment-runner \
  front:eevee-front-deployment:eevee-front \
  sourceStorage:source-storage:source-storage; do
  IFS=: read -r component deployment container <<< "$mapping"
  image=$(kubectl -n "$NAMESPACE" get deployment "$deployment" --ignore-not-found \
    -o "jsonpath={.spec.template.spec.containers[?(@.name=='$container')].image}")
  # Missing deployments use chart defaults on first install. API errors abort.
  if [[ -z "$image" ]]; then
    continue
  fi
  if [[ "$image" == *@* || "${image##*/}" != *:* ]]; then
    echo "Cannot preserve unsupported image reference for $deployment: $image" >&2
    exit 1
  fi
  image_args+=(--set-string "$component.image.repository=${image%:*}"
               --set-string "$component.image.tag=${image##*:}")
done

# Explicit caller overrides come last, e.g. the image built by this workflow.
helm upgrade --install "$RELEASE" "$CHART" --namespace "$NAMESPACE" \
  --reset-values -f "$CHART/values.yaml" "${image_args[@]}" "$@" \
  --wait --timeout 10m
