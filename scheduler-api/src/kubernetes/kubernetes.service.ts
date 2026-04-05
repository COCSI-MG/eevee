import { Injectable } from '@nestjs/common';
import { Client1_13 } from 'kubernetes-client';
import { config } from 'kubernetes-client';
import { DEFAULT_NAMESPACE, K8S_JOB_STATUS } from './kubernetes.constants';
import { KubernetesJobOptions, KubernetesJobResult } from './kubernetes.interfaces';

@Injectable()
export class KubernetesService {
  private client = new Client1_13({
    config: process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT
      ? config.getInCluster()
      : config.fromKubeconfig(), 
    version: '1.13',
  });

  constructor() { }

  private appendConfigMapVolumesAndMounts(
    configMaps: NonNullable<KubernetesJobOptions['configMap']>,
    volumes: any[],
    volumeMounts: any[],
  ) {
    configMaps.forEach((cm) => {
      volumes.push({
        name: cm.volumeName,
        configMap: {
          name: cm.name,
        },
      });

      volumeMounts.push({
        name: cm.volumeName,
        mountPath: cm.mountPath,
      });
    });
  }

  private appendSharedEmptyDirVolumeAndMounts(
    sharedEmptyDir: NonNullable<KubernetesJobOptions['sharedEmptyDir']>,
    volumes: any[],
    volumeMounts: any[],
  ) {
    volumes.push({
      name: sharedEmptyDir.volumeName,
      emptyDir: {},
    });

    sharedEmptyDir.mounts.forEach((mount) => {
      volumeMounts.push({
        name: sharedEmptyDir.volumeName,
        mountPath: mount.mountPath,
        ...(mount.subPath ? { subPath: mount.subPath } : {}),
      });
    });
  }

  private buildInitContainers(options?: KubernetesJobOptions) {
    return (
      options?.initContainers?.map((container) => ({
        name: container.name,
        image: container.image,
        imagePullPolicy: container.imagePullPolicy || 'Never',
        ...(container.restartPolicy ? { restartPolicy: container.restartPolicy } : {}),
        ...(container.command?.length ? { command: container.command } : {}),
        ...(container.env?.length ? { env: container.env } : {}),
        ...(options?.sharedEmptyDir
          ? {
            volumeMounts: options.sharedEmptyDir.mounts.map((mount) => ({
              name: options.sharedEmptyDir!.volumeName,
              mountPath: mount.mountPath,
              ...(mount.subPath ? { subPath: mount.subPath } : {}),
            })),
          }
          : {}),
      })) || []
    );
  }

  async checkIfJobExists(jobName: string): Promise<boolean> {
    try {
      const response = await this.client.apis.batch.v1
        .namespaces(DEFAULT_NAMESPACE)
        .jobs(jobName)
        .get();
      console.log('Job exists:', response);
      return true;
    } catch (err) {
      console.error('Error checking if job exists:', err);
      return false;
    }
  }

  async getJob(jobName: string) {
    try {
      const response = await this.client.apis.batch.v1
        .namespaces(DEFAULT_NAMESPACE)
        .jobs(jobName)
        .get();
      console.log('Job:', response);
      return response;
    } catch (err) {
      console.error('Error getting job:', err);
    }
  }

  async deleteJob(jobName: string): Promise<void> {
    try {
      const response = await this.client.apis.batch.v1
        .namespaces(DEFAULT_NAMESPACE)
        .jobs(jobName)
        .delete();
      console.log('Job deleted:', response);
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  }

  async getJobPods(jobName: string) {
    const pods = await this.client.api.v1
      .namespaces(DEFAULT_NAMESPACE)
      .pods.get({
        qs: {
          labelSelector: `job-name=${jobName}`,
        },
      });
    return pods.body.items;
  }

  private unescapeAnsi(text: string): string {
    // This regex matches common ANSI escape codes.
    // It covers sequences like: ESC [ ... m
    // where ESC is \x1B (or \u001b)
    if (!text) return "";

    return text.replace(/\x1b\[.*?m/g, '');
  }

  async getJobLogs(podName: string, containerName?: string): Promise<string> {
    const logs = await this.client.api.v1
      .namespaces(DEFAULT_NAMESPACE)
      .pods(podName)
      .log.get({
        qs: {
          pretty: 'true',
          ...(containerName ? { container: containerName } : {}),
        },
      });
    return this.unescapeAnsi(logs.body);
  }

  private async getJobLogsWithRetry(
    podName: string,
    containerName?: string,
  ): Promise<string> {
    const maxRetries = 15;
    const retryDelayMs = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.getJobLogs(podName, containerName);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isContainerStillInitializing =
          message.includes('PodInitializing') ||
          message.includes('ContainerCreating') ||
          message.includes('waiting to start');

        if (!isContainerStillInitializing || attempt === maxRetries - 1) {
          throw err;
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    throw new Error(`Unable to fetch logs for pod ${podName}`);
  }

  async createJob(
    jobName: string,
    imageName: string,
    command: string[],
    options?: KubernetesJobOptions,
  ) {
    const volumes: any[] = [];
    const volumeMounts: any[] = [];

    if (options?.configMap) {
      this.appendConfigMapVolumesAndMounts(
        options.configMap,
        volumes,
        volumeMounts,
      );
    }

    if (options?.sharedEmptyDir) {
      this.appendSharedEmptyDirVolumeAndMounts(
        options.sharedEmptyDir,
        volumes,
        volumeMounts,
      );
    }

    const initContainers = this.buildInitContainers(options);

    const jobManifest = {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: jobName,
      },
      spec: {
        restartPolicy: 'Never', // 
        template: {
          spec: {
            ...(initContainers.length ? { initContainers } : {}),
            containers: [
              {
                name: jobName,
                imagePullPolicy: 'Never',
                image: imageName,
                ...(command.length > 0 && { command: command }),
                volumeMounts: volumeMounts,
              },
            ],
            volumes: volumes,
            restartPolicy: 'Never',
          },
        },
        backoffLimit: 4,
      },
    };

    try {
      const response = await this.client.apis.batch.v1
        .namespaces(DEFAULT_NAMESPACE)
        .jobs.post({
          body: jobManifest,
        });
      console.log('Job created:', response);
      return response;
    } catch (err) {
      console.error('Error creating job:', err);
      throw err;
    }
  }

  async createAndWaitForJobCompletion(
    jobName: string,
    imageName: string,
    command: string[],
    options?: KubernetesJobOptions,
  ): Promise<KubernetesJobResult> {
    try {
      await this.createJob(jobName, imageName, command, options);

      let i = 0;
      const maxRetries = 100;
      const iterationWaitTime = 2000; // 2 seconds

      let jobStatus;
      do {
        // theres no native function to waiting for a job to complete
        // so we need to check the job status every few seconds
        await new Promise((resolve) => setTimeout(resolve, iterationWaitTime)); // Wait for 5 seconds before checking again
        const response = await this.getJob(jobName);
        jobStatus = response.body.status;
      } while (!jobStatus.succeeded && !jobStatus.failed && i++ < maxRetries);

      if (!jobStatus?.succeeded && !jobStatus?.failed) {
        throw new Error(
          `Job ${jobName} did not finish within ${maxRetries * iterationWaitTime}ms`,
        );
      }

      const status = jobStatus.succeeded
        ? K8S_JOB_STATUS.SUCCEEDED
        : K8S_JOB_STATUS.FAILED;

      // Get the pods created by the job
      const [pod] = await this.getJobPods(jobName);

      // Get the name of the first pod
      const podName = pod.metadata.name;
      const jobLogs = await this.getJobLogsWithRetry(podName, jobName);

      console.log('Job status:', status);

      const result = {
        name: jobName,
        status,
        message: jobLogs,
      };

      return result;
    } catch (err) {
      console.error('Error creating job:', err);
      throw err;
    }
  }

  async createConfigMap(name: string, data: Record<string, string>) {
    const manifest = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: name,
        namespace: DEFAULT_NAMESPACE,
      },
      data: data,
    };

    try {
      const response = await this.client.api.v1
        .namespaces(DEFAULT_NAMESPACE)
        .configmaps.post({
          body: manifest,
        });
      console.log('ConfigMap created:', response);
      return response;
    } catch (err) {
      console.error('Error creating ConfigMap:', err);
      throw err;
    }
  }

  async deleteConfigMap(name: string) {
    try {
      const response = await this.client.api.v1
        .namespaces(DEFAULT_NAMESPACE)
        .configmaps(name)
        .delete();
      console.log('ConfigMap deleted:', response);
    } catch (err) {
      console.error('Error deleting ConfigMap:', err);
    }
  }
}
