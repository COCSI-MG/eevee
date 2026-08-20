import { KubernetesJobSharedEmptyDir } from 'src/kubernetes/kubernetes.interfaces';

export function buildSharedEmptyDirMounts(
  srcPath: string,
  testPath: string,
): KubernetesJobSharedEmptyDir['mounts'] {
  const uniquePaths = [...new Set([srcPath, testPath])];

  return uniquePaths.map((mountPath, index) => ({
    mountPath,
    subPath: index === 0 ? 'src' : 'test',
  }));
}
