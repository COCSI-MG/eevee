import { Module } from '@nestjs/common';
import { TemplateParamsService } from './template-params.service';
import { TemplateParamsController } from './template-params.controller';

@Module({
  controllers: [TemplateParamsController],
  providers: [TemplateParamsService],
})
export class TemplateParamsModule {}
