import { Test, TestingModule } from '@nestjs/testing';
import { KubernetesService } from 'src/kubernetes/kubernetes.service';
import { WorkerService } from './worker.service';

describe('WorkerService', () => {
  let service: WorkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkerService,
        {
          provide: KubernetesService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WorkerService>(WorkerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('preserves the configured bootstrap tag for protocol-compatible jobs', () => {
    const previous = process.env.WORKER_BOOTSTRAP_IMAGE;
    process.env.WORKER_BOOTSTRAP_IMAGE = 'registry:5000/worker-bootstrap:snapshot-v1';
    try {
      jest.isolateModules(() => {
        const constants = jest.requireActual<typeof import('./worker.constants')>(
          './worker.constants',
        );
        expect(constants.WORKER_BOOTSTRAP_IMAGE_NAME).toBe(
          'registry:5000/worker-bootstrap:snapshot-v1',
        );
      });
    } finally {
      if (previous === undefined) delete process.env.WORKER_BOOTSTRAP_IMAGE;
      else process.env.WORKER_BOOTSTRAP_IMAGE = previous;
    }
  });
});
