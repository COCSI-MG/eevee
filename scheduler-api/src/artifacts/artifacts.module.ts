import { Module } from '@nestjs/common';
import { ArtifactsService } from './artifacts.service';

@Module({
  providers: [ArtifactsService],
  exports: [ArtifactsService],
})
export class ArtifactsModule {}
