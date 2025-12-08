import { Test, TestingModule } from '@nestjs/testing';
import { KubernetesController } from './kubernetes.controller';
import { KubernetesService } from './kubernetes.service';

describe('KubernetesController', () => {
  let controller: KubernetesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KubernetesController],
      providers: [KubernetesService],
    }).compile();

    controller = module.get<KubernetesController>(KubernetesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
