import { Module } from '@nestjs/common';
import { KubernetesService } from './kubernetes.service';
import { KubernetesController } from './kubernetes.controller';

@Module({
  controllers: [KubernetesController],
  providers: [KubernetesService],
  exports: [KubernetesService],
})
export class KubernetesModule {}
