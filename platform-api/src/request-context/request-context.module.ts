import { Module } from '@nestjs/common';
import { RequestContextService } from './request-context.service';

@Module({
  providers: [RequestContextService],
  exports: [RequestContextService],
})
export class RequestContextModule {}
