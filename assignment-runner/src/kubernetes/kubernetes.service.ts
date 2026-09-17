import { Injectable } from '@nestjs/common';
import { Client1_13, config } from 'kubernetes-client';
import {
  DEFAULT_NAMESPACE,
  JOB_IMAGE_PULL_POLICY,
  JOB_IMAGE_PULL_SECRETS,
  JOB_NODE_SELECTOR,
  K8S_JOB_STATUS,
} from './kubernetes.constants';
import {
  KubernetesJobOptions,
  KubernetesJobResult,
} from './kubernetes.interfaces';

@Injectable()
export class KubernetesService {
  private client = new Client1_13({
    config:
      process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT
        ? config.getInCluster()
        : config.fromKubeconfig(),
    version: '1.13',
  });

  constructor() {}

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

  private appendSecretVolumesAndMounts(
    secretVolumes: NonNullable<KubernetesJobOptions['secretVolumes']>,
    volumes: any[],
    volumeMounts: any[],
  ) {
    secretVolumes.forEach((sv) => {
      volumes.push({
        name: sv.volumeName,
        secret: { secretName: sv.secretName },
      });
      volumeMounts.push({
        name: sv.volumeName,
        mountPath: sv.mountPath,
        readOnly: true,
      });
    });
  }

  private buildInitContainers(options?: KubernetesJobOptions) {
    return (
      options?.initContainers?.map((container) => ({
        name: container.name,
        image: container.image,
        imagePullPolicy: container.imagePullPolicy || JOB_IMAGE_PULL_POLICY,
        ...(container.restartPolicy
          ? { restartPolicy: container.restartPolicy }
          : {}),
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
        .delete({
          qs: {
            propagationPolicy: 'Foreground',
          },
        });
      console.log('Job deleted:', response);
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  }

  async deletePodsByJobName(jobName: string): Promise<void> {
    try {
      const pods = await this.getJobPods(jobName);

      await Promise.all(
        pods.map((pod) =>
          this.client.api.v1
            .namespaces(DEFAULT_NAMESPACE)
            .pods(pod.metadata.name)
            .delete(),
        ),
      );
    } catch (err) {
      console.error('Error deleting job pods:', err);
    }
  }

  async deleteJobAndPods(jobName: string): Promise<void> {
    await Promise.all([
      this.deleteJob(jobName),
      this.deletePodsByJobName(jobName),
    ]);
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
    if (!text) return '';

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

    if (options?.secretVolumes?.length) {
      this.appendSecretVolumesAndMounts(
        options.secretVolumes,
        volumes,
        volumeMounts,
      );
    }

    const initContainers = this.buildInitContainers(options);
    if (options?.seedSql) {
      const bootstrap = initContainers.find(
        (container) => container.name === 'eevee-worker-bootstrap',
      );
      if (!bootstrap || !options.sharedEmptyDir) {
        throw new Error('SQL seeding requires the bootstrap shared volume');
      }
      volumes.push({
        name: 'database-seed',
        configMap: { name: `${jobName}-seed` },
      });
      bootstrap.volumeMounts = [
        ...(bootstrap.volumeMounts || []),
        { name: 'database-seed', mountPath: '/eevee-seed' },
      ];
      // Node copies bytes without ever interpreting the SQL as shell source.
      bootstrap.command = [
        'sh',
        '-c',
        'npm start && node -e \'require("fs").copyFileSync(process.argv[1], process.argv[2])\' "$1" "$2"',
        'seed-copy',
        '/eevee-seed/init.sql',
        options.seedSql.targetPath,
      ];
    }
    const podLabels = options?.podLabels || {};

    const jobManifest = {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: jobName,
        ...(Object.keys(podLabels).length ? { labels: podLabels } : {}),
      },
      spec: {
        activeDeadlineSeconds: options?.activeDeadlineSeconds ?? 210,
        ttlSecondsAfterFinished: options?.ttlSecondsAfterFinished ?? 900,
        template: {
          ...(Object.keys(podLabels).length
            ? {
                metadata: {
                  labels: podLabels,
                },
              }
            : {}),
          spec: {
            ...(initContainers.length ? { initContainers } : {}),
            automountServiceAccountToken: false, // security best practice
            ...(JOB_NODE_SELECTOR ? { nodeSelector: JOB_NODE_SELECTOR } : {}),
            ...(JOB_IMAGE_PULL_SECRETS.length
              ? {
                  imagePullSecrets: JOB_IMAGE_PULL_SECRETS.map((name) => ({
                    name,
                  })),
                }
              : {}),
            containers: [
              {
                name: jobName,
                imagePullPolicy: JOB_IMAGE_PULL_POLICY,
                image: imageName,
                ...(options?.resources ? { resources: options.resources } : {}),
                ...(command.length > 0 && { command: command }),
                ...(options?.mainContainerEnv?.length
                  ? { env: options.mainContainerEnv }
                  : {}),
                volumeMounts: volumeMounts,
              },
            ],
            volumes: volumes,
            restartPolicy: 'Never',
          },
        },
        backoffLimit: options?.backoffLimit ?? 0,
      },
    };

    try {
      const response = await this.client.apis.batch.v1
        .namespaces(DEFAULT_NAMESPACE)
        .jobs.post({
          body: jobManifest,
        });
      console.log('Job created:', response);
      if (options?.seedSql) {
        try {
          await this.createConfigMap(
            `${jobName}-seed`,
            { 'init.sql': options.seedSql.content },
            [
              {
                apiVersion: 'batch/v1',
                kind: 'Job',
                name: jobName,
                uid: response.body.metadata.uid,
              },
            ],
          );
        } catch (error) {
          await this.deleteJobAndPods(jobName);
          throw error;
        }
      }
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

        if (!response?.body?.status) {
          throw new Error(
            `Job ${jobName} was not found while waiting for completion. It may have been deleted or cancelled.`,
          );
        }

        jobStatus = response.body.status;
      } while (!jobStatus.succeeded && !jobStatus.failed && ++i < maxRetries);

      if (!jobStatus?.succeeded && !jobStatus?.failed) {
        await this.deleteJobAndPods(jobName);
        throw new Error(
          `Job ${jobName} did not finish within ${maxRetries * iterationWaitTime}ms`,
        );
      }

      const status = jobStatus.succeeded
        ? K8S_JOB_STATUS.SUCCEEDED
        : K8S_JOB_STATUS.FAILED;

      // Get the pods created by the job
      const [pod] = await this.getJobPods(jobName);

      if (!pod?.metadata?.name) {
        throw new Error(`No pod found for job ${jobName}.`);
      }

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

  async createConfigMap(
    name: string,
    data: Record<string, string>,
    ownerReferences?: {
      apiVersion: string;
      kind: string;
      name: string;
      uid: string;
    }[],
  ) {
    const manifest = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: name,
        namespace: DEFAULT_NAMESPACE,
        ...(ownerReferences ? { ownerReferences } : {}),
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
