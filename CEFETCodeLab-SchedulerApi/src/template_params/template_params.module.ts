import { Module } from '@nestjs/common';
import { TemplateParamsService } from './template_params.service';
import { TemplateParamsController } from './template_params.controller';

@Module({
  controllers: [TemplateParamsController],
  providers: [TemplateParamsService],
})
export class TemplateParamsModule {}
