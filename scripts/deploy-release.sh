#!/usr/bin/env bash
set -euo pipefail

# Configuration comes from Git, never from an older Helm release. Preserve only
# the live app image references (including images deployed by legacy kubectl jobs).
CHART=${CHART:-infrastructure/helm/eevee}
NAMESPACE=${NAMESPACE:-eevee-cefetrj}
RELEASE=${RELEASE:-eevee}
image_args=()
for mapping in platformApi:platform-api-deployment:platform-api assignmentRunner:assignment-runner-deployment:assignment-runner front:eevee-front-deployment:eevee-front; do
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
