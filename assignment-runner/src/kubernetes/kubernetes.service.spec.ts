jest.mock('kubernetes-client', () => ({
  Client1_13: jest.fn().mockImplementation(() => ({})),
  config: {
    fromKubeconfig: jest.fn(() => ({})),
    getInCluster: jest.fn(() => ({})),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { KubernetesService } from './kubernetes.service';
import { DEFAULT_NAMESPACE } from './kubernetes.constants';

describe('KubernetesService', () => {
  let service: KubernetesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KubernetesService],
    }).compile();

    service = module.get<KubernetesService>(KubernetesService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('builds a bounded Job with the database resource requirements', async () => {
    const post = jest.fn().mockResolvedValue({});
    (service as any).client = {
      apis: { batch: { v1: { namespaces: () => ({ jobs: { post } }) } } },
    };
    const resources = {
      requests: { cpu: '100m', memory: '256Mi' },
      limits: { cpu: '1', memory: '768Mi' },
    };
    await service.createJob('database-test', 'database-image', ['entrypoint'], {
      resources,
      initContainers: [{ name: 'eevee-worker-bootstrap', image: 'bootstrap' }],
    });
    const { spec } = post.mock.calls[0][0].body;
    expect(spec.activeDeadlineSeconds).toBe(210);
    expect(spec.ttlSecondsAfterFinished).toBe(900);
    expect(spec.backoffLimit).toBe(0);
    expect(spec.restartPolicy).toBeUndefined();
    expect(spec.template.spec.restartPolicy).toBe('Never');
    expect(spec.template.spec.containers).toHaveLength(1);
    expect(spec.template.spec.containers[0].resources).toEqual(resources);
    expect(spec.template.spec.initContainers.map((c: any) => c.name)).toEqual([
      'eevee-worker-bootstrap',
    ]);
  });

  it('awaits Job and Pod cleanup before rejecting at 200 seconds', async () => {
    jest.useFakeTimers();
    jest.spyOn(service, 'createJob').mockResolvedValue({});
    jest
      .spyOn(service, 'getJob')
      .mockResolvedValue({ body: { status: { active: 1 } } });
    let releaseCleanup!: () => void;
    const cleanup = jest.spyOn(service, 'deleteJobAndPods').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseCleanup = resolve;
        }),
    );
    let settled = false;
    const result = service
      .createAndWaitForJobCompletion('stuck', 'image', [])
      .catch((error) => {
        settled = true;
        return error;
      });
    await jest.advanceTimersByTimeAsync(200000);
    expect(cleanup).toHaveBeenCalledWith('stuck');
    expect(settled).toBe(false);
    releaseCleanup();
    expect((await result).message).toContain('200000ms');
  });

  it('creates seed data outside the Pod environment with Job ownership', async () => {
    const post = jest
      .fn()
      .mockResolvedValue({ body: { metadata: { uid: 'job-uid' } } });
    (service as any).client = {
      apis: { batch: { v1: { namespaces: () => ({ jobs: { post } }) } } },
    };
    const createSeed = jest
      .spyOn(service, 'createConfigMap')
      .mockResolvedValue({});
    const sql = 'SELECT ' + '1,'.repeat(100000) + '1;';
    await service.createJob('seeded', 'image', [], {
      seedSql: { content: sql, targetPath: '/app/test/.eevee-init.sql' },
      sharedEmptyDir: {
        volumeName: 'files',
        mounts: [{ mountPath: '/app/test', subPath: 'test' }],
      },
      initContainers: [{ name: 'eevee-worker-bootstrap', image: 'bootstrap' }],
    });
    expect(createSeed).toHaveBeenCalledWith(
      'seeded-seed',
      { 'init.sql': sql },
      [{ apiVersion: 'batch/v1', kind: 'Job', name: 'seeded', uid: 'job-uid' }],
    );
    const pod = post.mock.calls[0][0].body.spec.template.spec;
    expect(JSON.stringify(pod)).not.toContain(sql);
    expect(pod.initContainers[0].command.slice(-2)).toEqual([
      '/eevee-seed/init.sql',
      '/app/test/.eevee-init.sql',
    ]);
    expect(pod.volumes).toContainEqual({
      name: 'database-seed',
      configMap: { name: 'seeded-seed' },
    });
  });

  it('removes a waiting Job if publishing its SQL seed fails', async () => {
    (service as any).client = {
      apis: {
        batch: {
          v1: {
            namespaces: () => ({
              jobs: {
                post: async () => ({ body: { metadata: { uid: 'uid' } } }),
              },
            }),
          },
        },
      },
    };
    jest
      .spyOn(service, 'createConfigMap')
      .mockRejectedValue(new Error('seed rejected'));
    const cleanup = jest.spyOn(service, 'deleteJobAndPods').mockResolvedValue();
    await expect(
      service.createJob('bad-seed', 'image', [], {
        seedSql: {
          content: 'SELECT 1',
          targetPath: '/app/test/.eevee-init.sql',
        },
        sharedEmptyDir: {
          volumeName: 'files',
          mounts: [{ mountPath: '/app/test' }],
        },
        initContainers: [
          { name: 'eevee-worker-bootstrap', image: 'bootstrap' },
        ],
      }),
    ).rejects.toThrow('seed rejected');
    expect(cleanup).toHaveBeenCalledWith('bad-seed');
  });

  it.each([{ succeeded: 1 }, { failed: 1 }])(
    'collects logs immediately on terminal status %j',
    async (status) => {
      jest.useFakeTimers();
      jest.spyOn(service, 'createJob').mockResolvedValue({});
      jest.spyOn(service, 'getJob').mockResolvedValue({ body: { status } });
      jest
        .spyOn(service, 'getJobPods')
        .mockResolvedValue([{ metadata: { name: 'pod' } }]);
      const logs = jest
        .spyOn(service, 'getJobLogs')
        .mockResolvedValue('test output');
      const cleanup = jest.spyOn(service, 'deleteJobAndPods');
      const result = service.createAndWaitForJobCompletion(
        'finished',
        'image',
        [],
      );
      await jest.advanceTimersByTimeAsync(2000);
      expect((await result).message).toBe('test output');
      expect(logs).toHaveBeenCalledWith('pod', 'finished');
      expect(cleanup).not.toHaveBeenCalled();
    },
  );

  it('deletes pods using the stable job-name label instead of pod name guessing', async () => {
    const deletePod = jest.fn().mockResolvedValue({});
    const getPods = jest.fn().mockResolvedValue({
      body: {
        items: [
          { metadata: { name: 'preview-run-9-worker-45pzr' } },
          { metadata: { name: 'preview-run-9-worker-abc12' } },
        ],
      },
    });

    (service as any).client = {
      api: {
        v1: {
          namespaces: jest.fn().mockReturnValue({
            pods: Object.assign(
              jest.fn((podName?: string) =>
                podName ? { delete: deletePod } : { get: getPods },
              ),
              { get: getPods },
            ),
          }),
        },
      },
    };

    await service.deletePodsByJobName('preview-run-9-worker');

    expect(getPods).toHaveBeenCalledWith({
      qs: {
        labelSelector: 'job-name=preview-run-9-worker',
      },
    });
    expect(deletePod).toHaveBeenCalledTimes(2);
    expect(deletePod).toHaveBeenNthCalledWith(1);
    expect(deletePod).toHaveBeenNthCalledWith(2);
    expect((service as any).client.api.v1.namespaces).toHaveBeenCalledWith(
      DEFAULT_NAMESPACE,
    );
  });

  it('cancels by deleting both the job and its matching pods', async () => {
    const deleteJob = jest
      .spyOn(service, 'deleteJob')
      .mockResolvedValue(undefined);
    const deletePodsByJobName = jest
      .spyOn(service, 'deletePodsByJobName')
      .mockResolvedValue(undefined);

    await service.deleteJobAndPods('preview-run-9-worker');

    expect(deleteJob).toHaveBeenCalledWith('preview-run-9-worker');
    expect(deletePodsByJobName).toHaveBeenCalledWith('preview-run-9-worker');
  });
});
