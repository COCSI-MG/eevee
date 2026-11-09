#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Deliberately keep the workflow's untagged repository variables in scope.
# Mocks must not interpret these build inputs as live Kubernetes image references.
export FRONT_IMAGE=${FRONT_IMAGE:-cocsi-mg/eevee-front}
export PLATFORM_API_IMAGE=${PLATFORM_API_IMAGE:-cocsi-mg/eevee-platform-api}
export ASSIGNMENT_RUNNER_IMAGE=${ASSIGNMENT_RUNNER_IMAGE:-cocsi-mg/eevee-assignment-runner}

# Initialize fixture inputs so the caller's environment cannot change test cases.
export CHART=infrastructure/helm/eevee NAMESPACE=eevee-cefetrj RELEASE=eevee
export DEPLOY_TEST_FAIL_KUBECTL=0 DEPLOY_TEST_EMPTY_CLUSTER=0
export DEPLOY_TEST_LEGACY_WRITER=1
export DEPLOY_TEST_LEGACY_PODS=
export DEPLOY_TEST_FRONT_IMAGE=registry/front:old-front

# Exercise production argument precedence without a cluster or registry.
kubectl() {
  [[ ${DEPLOY_TEST_FAIL_KUBECTL} == 0 ]] || return 1
  [[ ${DEPLOY_TEST_EMPTY_CLUSTER} == 0 ]] || return 0
  case "$*" in
    *'get pods'*) printf '%s' "${DEPLOY_TEST_LEGACY_PODS}" ;;
    *'get deployment source-storage'*) printf '%s' 'registry/storage:old-storage' ;;
    *".name=='source-storage'"*) printf '%s' "${DEPLOY_TEST_LEGACY_WRITER}" ;;
    *platform-api-deployment*) printf '%s' 'registry:5000/api:old-api' ;;
    *assignment-runner-deployment*) printf '%s' 'registry/runner:old-runner' ;;
    *eevee-front-deployment*) printf '%s' "${DEPLOY_TEST_FRONT_IMAGE}" ;;
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
grep -qx 'sourceStorage.image.repository=registry/storage' <<< "$output"
grep -qx 'sourceStorage.image.tag=old-storage' <<< "$output"
[[ $(grep 'platformApi.image.tag=' <<< "$output" | tail -1) == 'platformApi.image.tag=new-api' ]]
! grep -q -- '--reuse-values\|--reset-then-reuse-values' <<< "$output"

output=$(bash scripts/deploy-release.sh --set-string sourceStorage.image.tag=new-storage)
grep -qx 'platformApi.image.tag=old-api' <<< "$output"
[[ $(grep 'sourceStorage.image.tag=' <<< "$output" | tail -1) == 'sourceStorage.image.tag=new-storage' ]]
if DEPLOY_TEST_LEGACY_WRITER=1source-storage bash scripts/deploy-release.sh >/dev/null 2>&1; then
  echo 'Storage handoff must reject an active legacy writer' >&2; exit 1
fi
if DEPLOY_TEST_LEGACY_WRITER=0source-storage DEPLOY_TEST_LEGACY_PODS=source-storage bash scripts/deploy-release.sh >/dev/null 2>&1; then
  echo 'Storage handoff must wait for terminating legacy pods' >&2; exit 1
fi
output=$(DEPLOY_TEST_EMPTY_CLUSTER=1 bash scripts/deploy-release.sh)
grep -qx -- '--install' <<< "$output"
! grep -q 'image.tag=' <<< "$output"

if DEPLOY_TEST_FAIL_KUBECTL=1 bash scripts/deploy-release.sh > /dev/null 2>&1; then
  echo 'Cluster read failures must abort deployment' >&2; exit 1
fi
if DEPLOY_TEST_FRONT_IMAGE=registry/front@sha256:abc bash scripts/deploy-release.sh > /dev/null 2>&1; then
  echo 'Unsupported image references must not be silently replaced' >&2; exit 1
fi
echo 'Deployment regression checks passed'
