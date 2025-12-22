import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { WorkerController } from './worker.controller';
import { KubernetesModule } from 'src/kubernetes/kubernetes.module';
import { ArtifactsModule } from 'src/artifacts/artifacts.module';

@Module({
  controllers: [WorkerController],
  providers: [WorkerService],
  imports: [KubernetesModule, ArtifactsModule],
  exports: [WorkerService],
})
export class WorkerModule {}
