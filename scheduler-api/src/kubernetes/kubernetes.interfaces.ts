export interface KubernetesJobResult {
  name: string;
  status: string;
  message: string;
}

export interface KubernetesJobConfigMap {
  name: string;
  volumeName: string;
  mountPath: string;
}

export interface KubernetesJobInitContainer {
  name: string;
  image: string;
  imagePullPolicy?: 'Never' | 'IfNotPresent' | 'Always';
  restartPolicy?: 'Always';
  command?: string[];
  env?: {
    name: string;
    value: string;
  }[];
}

export interface KubernetesJobSharedEmptyDir {
  volumeName: string;
  mounts: {
    mountPath: string;
    subPath?: string;
  }[];
}

export interface KubernetesJobSecretVolume {
  secretName: string;
  volumeName: string;
  mountPath: string;
}

export interface KubernetesJobEnvVar {
  name: string;
  value: string;
}

export interface KubernetesJobOptions {
  configMap?: KubernetesJobConfigMap[];
  initContainers?: KubernetesJobInitContainer[];
  sharedEmptyDir?: KubernetesJobSharedEmptyDir;
  secretVolumes?: KubernetesJobSecretVolume[];
  mainContainerEnv?: KubernetesJobEnvVar[];
  command?: string[];
  backoffLimit?: number;
}
