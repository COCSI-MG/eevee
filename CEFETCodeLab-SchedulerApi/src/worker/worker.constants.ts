export enum WORKER_JOB_PREFFIX {
  NODE_DEFAULT = 'worker-node-default',
  NODE_NESTJS = 'worker-node-nestjs',
  NODE_REACT = 'worker-node-react',
}

export enum WORKER_IMAGE_NAMES {
  NODE_DEFAULT = 'docker.io/library/worker-node-default-img:latest',
  NODE_NESTJS = 'docker.io/library/worker-node-nestjs-img:latest',
  // NODE_REACT
}

// CHARS USED TO IDENTIFY WORKER OUTPUT RESPONSES
export enum WORKER_IDENTIFYING_CHARS {
  SUCCESS = '✓',
  FAILURE = '✕',
}
