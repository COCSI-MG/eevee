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
  command?: string[];
  env?: {
    name: string;
    value: string;
  }[];
}

export interface KubernetesJobSharedEmptyDir {
  volumeName: string;
  mountPath: string;
}

export interface KubernetesJobOptions {
  configMap?: KubernetesJobConfigMap[];
  initContainers?: KubernetesJobInitContainer[];
  sharedEmptyDir?: KubernetesJobSharedEmptyDir;
}
