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
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

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
