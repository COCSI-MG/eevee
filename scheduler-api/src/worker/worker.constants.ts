import { WorkerType } from './enum/worker-type.enum';

export const WORKER_JOB_PREFFIX = {
  [WorkerType.NODE_DEFAULT]: 'worker-node-default',
  [WorkerType.NODE_NESTJS]: 'worker-node-nestjs',
  [WorkerType.NODE_GRPCJS]: 'worker-node-grpcjs',
  [WorkerType.NODE_NEXTJS_CYPRESS]: 'worker-node-nextjs-cypress',
};

export const WORKER_IMAGE_NAMES = {
  [WorkerType.NODE_DEFAULT]: 'docker.io/library/worker-node-default-img:latest',
  [WorkerType.NODE_NESTJS]: 'docker.io/library/worker-node-nestjs-img:latest',
  [WorkerType.NODE_GRPCJS]: 'docker.io/library/worker-node-grpcjs-img:latest',
  [WorkerType.NODE_NEXTJS_CYPRESS]:
    'docker.io/library/worker-node-nextjs-cypress-img:latest',
};

// CHARS USED TO IDENTIFY WORKER OUTPUT RESPONSES
export enum WORKER_IDENTIFYING_CHARS {
  SUCCESS = '✓',
  FAILURE = '✕',
}
