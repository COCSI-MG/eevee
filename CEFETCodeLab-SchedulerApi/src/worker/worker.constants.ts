export enum WORKER_JOB_PREFFIX {
  NODE_DEFAULT = 'worker-node-default',
  NODE_NESTJS = 'worker-node-nestjs',
  REACT_CYPRESS = 'worker-react-cypress-default',
  NEXTJS_CYPRESS = 'worker-nextjs-cypress',
}

export enum WORKER_IMAGE_NAMES {
  NODE_DEFAULT = 'docker.io/library/worker-node-default:latest',
  NODE_NESTJS = 'docker.io/library/worker-node-nestjs:latest',
  REACT_CYPRESS = 'docker.io/library/worker-react-cypress:latest',
  NEXTJS_CYPRESS = 'docker.io/library/worker-nextjs-cypress:latest',
  // NODE_REACT
}

// CHARS USED TO IDENTIFY WORKER OUTPUT RESPONSES
export enum WORKER_IDENTIFYING_CHARS {
  SUCCESS = '✓',
  FAILURE = '✕',
}

export const WORKER_DEFAULT_INPUT_PATH = '/app/inputs';