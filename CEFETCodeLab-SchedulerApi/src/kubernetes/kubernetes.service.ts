import { Injectable } from '@nestjs/common';
import { Client1_13 } from 'kubernetes-client';
import { config } from 'kubernetes-client';
import { DEFAULT_NAMESPACE, K8S_JOB_STATUS } from './kubernetes.constants';
import { KubernetesJobResult } from './kubernetes.interfaces';

@Injectable()
export class KubernetesService {
  constructor() {}
  private client = new Client1_13({
    config: config.fromKubeconfig(),
    version: '1.13',
  });

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
    console.log('text: ', text)
    // This regex matches common ANSI escape codes.
    // It covers sequences like: ESC [ ... m
    // where ESC is \x1B (or \u001b)
  
     return text.replace(/\x1b\[.*?m/g, '');
  }

  async getJobLogs(podName: string): Promise<string> {
    console.log('podnames: ', podName)
    const logs = await this.client.api.v1
      .namespaces(DEFAULT_NAMESPACE)
      .pods(podName)
      .log.get({
        qs: {
          pretty: 'true',
        },
      });
      console.dir(logs, { depth: null });
    return this.unescapeAnsi(logs.body);
  }

  async createJob(jobName: string, imageName: string, command: string[]) {
    const jobManifest = {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: jobName,
      },
      spec: {
        template: {
          spec: {
            containers: [
              {
                name: jobName,
                imagePullPolicy: 'Never',
                image: imageName,
                command: command,
              },
            ],
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
      return;
    } catch (err) {
      console.error('Error creating job:', err);
      throw err;
    }
  }

  async createAndWaitForJobCompletion(
    jobName: string,
    imageName: string,
    command: string[],
  ): Promise<KubernetesJobResult> {
    try {
      await this.createJob(jobName, imageName, command);

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

      const status = jobStatus.succeeded
        ? K8S_JOB_STATUS.SUCCEEDED
        : K8S_JOB_STATUS.FAILED;

      // Get the pods created by the job
      const [pod] = await this.getJobPods(jobName);

      // Get the name of the first pod
      const podName = pod.metadata.name;
      const jobLogs = await this.getJobLogs(podName);

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
}
