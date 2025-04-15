import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './entities/template.entity';

@Module({
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
  imports: [TypeOrmModule.forFeature([Template])]
})
export class TemplateModule {}
