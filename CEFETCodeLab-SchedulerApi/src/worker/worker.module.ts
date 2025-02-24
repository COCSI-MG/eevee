import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { WorkerController } from './worker.controller';
import { KubernetesModule } from 'src/kubernetes/kubernetes.module';

@Module({
  controllers: [WorkerController],
  providers: [WorkerService],
  imports: [KubernetesModule],
  exports: [WorkerService],
})
export class WorkerModule {}
