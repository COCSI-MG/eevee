import { Controller } from '@nestjs/common';
import { KubernetesService } from './kubernetes.service';

@Controller()
export class KubernetesController {
  constructor(private readonly kubernetesService: KubernetesService) {}
}
