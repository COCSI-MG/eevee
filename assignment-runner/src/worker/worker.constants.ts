import { WorkerType } from './enum/worker-type.enum';

export function normalizeWorkerImageReference(image: string): string {
  const reference = image.trim();
  const lastSlash = reference.lastIndexOf('/');
  const lastColon = reference.lastIndexOf(':');
  // Keep explicit tags and content-addressed images. Only untagged names use
  // the legacy latest default (a registry port appears before the last slash).
  return lastColon > lastSlash ? reference : `${reference}:latest`;
}

function getImageFromEnv(envName: string, fallback: string): string {
  return normalizeWorkerImageReference(process.env[envName]?.trim() || fallback);
}

export const WORKER_JOB_PREFIX: Record<WorkerType, string> = {
  [WorkerType.NODE_DEFAULT]: 'worker-node-default',
  [WorkerType.JAVASCRIPT_DEFAULT]: 'worker-javascript-default',
  [WorkerType.NODE_NESTJS]: 'worker-node-nestjs',
  [WorkerType.NODE_GRPCJS]: 'worker-node-grpcjs',
  [WorkerType.NODE_NEXTJS_CYPRESS]: 'worker-node-nextjs-cypress',
  [WorkerType.NODE_REACTJS_CYPRESS]: 'worker-react-cypress-default',
  [WorkerType.NODE_DEFAULT_POSTGRESQL]: 'worker-node-default-pg',
  [WorkerType.NODE_NESTJS_POSTGRESQL]: 'worker-node-nestjs-pg',
  [WorkerType.NODE_TERAORM]: 'worker-node-teraorm',
  [WorkerType.PYTHON_DEFAULT]: 'worker-python-default',
};

export const WORKER_IMAGE_NAMES: Record<WorkerType, string> = {
  [WorkerType.NODE_DEFAULT]: getImageFromEnv(
    'WORKER_IMAGE_NODE_DEFAULT',
    'docker.io/library/worker-node-default-img:latest',
  ),
  [WorkerType.JAVASCRIPT_DEFAULT]: getImageFromEnv(
    'WORKER_IMAGE_JAVASCRIPT_DEFAULT',
    'docker.io/library/worker-node-javascript-default-img:latest',
  ),
  [WorkerType.NODE_NESTJS]: getImageFromEnv(
    'WORKER_IMAGE_NODE_NESTJS',
    'docker.io/library/worker-nestjs-default-img:latest',
  ),
  [WorkerType.NODE_GRPCJS]: getImageFromEnv(
    'WORKER_IMAGE_NODE_GRPCJS',
    'docker.io/library/worker-node-grpcjs-img:latest',
  ),
  [WorkerType.NODE_NEXTJS_CYPRESS]: getImageFromEnv(
    'WORKER_IMAGE_NODE_NEXTJS_CYPRESS',
    'docker.io/library/worker-node-nextjs-cypress-img:latest',
  ),
  [WorkerType.NODE_REACTJS_CYPRESS]: getImageFromEnv(
    'WORKER_IMAGE_NODE_REACTJS_CYPRESS',
    'docker.io/library/worker-react-cypress-img:latest',
  ),
  [WorkerType.NODE_DEFAULT_POSTGRESQL]: getImageFromEnv(
    'WORKER_IMAGE_NODE_DEFAULT_POSTGRESQL',
    'docker.io/library/worker-node-default-postgresql-img:latest',
  ),
  [WorkerType.NODE_NESTJS_POSTGRESQL]: getImageFromEnv(
    'WORKER_IMAGE_NODE_NESTJS_POSTGRESQL',
    'docker.io/library/worker-nestjs-postgresql-img:latest',
  ),
  [WorkerType.NODE_TERAORM]: getImageFromEnv(
    'WORKER_IMAGE_NODE_TERAORM',
    'docker.io/library/worker-node-teraorm-img:latest',
  ),
  [WorkerType.PYTHON_DEFAULT]: getImageFromEnv(
    'WORKER_IMAGE_PYTHON_DEFAULT',
    'docker.io/library/worker-python-default-img:latest',
  ),
};

export const WORKER_BOOTSTRAP_IMAGE_NAME = getImageFromEnv(
  'WORKER_BOOTSTRAP_IMAGE',
  'docker.io/library/eevee-worker-bootstrap:latest',
);

// CHARS USED TO IDENTIFY WORKER OUTPUT RESPONSES
export enum WORKER_IDENTIFYING_CHARS {
  SUCCESS = '✓',
  FAILURE = '✕',
}

export const WORKER_DEFINITION_B64_ENV_NAME = 'WORKER_DEFINITION_B64';
