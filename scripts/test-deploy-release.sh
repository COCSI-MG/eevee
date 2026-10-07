#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Exercise production argument precedence without a cluster or registry.
kubectl() {
  [[ ${FAIL_KUBECTL:-0} == 0 ]] || return 1
  [[ ${EMPTY_CLUSTER:-0} == 0 ]] || return 0
  case "$*" in
    *platform-api-deployment*) printf '%s' 'registry:5000/api:old-api' ;;
    *assignment-runner-deployment*) printf '%s' 'registry/runner:old-runner' ;;
    *eevee-front-deployment*) printf '%s' "${FRONT_IMAGE:-registry/front:old-front}" ;;
    *) return 1 ;;
  esac
}
helm() { printf '%s\n' "$@"; }
export -f kubectl helm

output=$(bash scripts/deploy-release.sh --set-string platformApi.image.tag=new-api)
grep -qx -- '--reset-values' <<< "$output"
grep -qx 'infrastructure/helm/eevee/values.yaml' <<< "$output"
grep -qx 'platformApi.image.repository=registry:5000/api' <<< "$output"
grep -qx 'assignmentRunner.image.tag=old-runner' <<< "$output"
grep -qx 'front.image.tag=old-front' <<< "$output"
[[ $(grep 'platformApi.image.tag=' <<< "$output" | tail -1) == 'platformApi.image.tag=new-api' ]]
! grep -q -- '--reuse-values\|--reset-then-reuse-values' <<< "$output"

output=$(EMPTY_CLUSTER=1 bash scripts/deploy-release.sh)
grep -qx -- '--install' <<< "$output"
! grep -q 'image.tag=' <<< "$output"

if FAIL_KUBECTL=1 bash scripts/deploy-release.sh > /dev/null 2>&1; then
  echo 'Cluster read failures must abort deployment' >&2; exit 1
fi
if FRONT_IMAGE=registry/front@sha256:abc bash scripts/deploy-release.sh > /dev/null 2>&1; then
  echo 'Unsupported image references must not be silently replaced' >&2; exit 1
fi
echo 'Deployment regression checks passed'
