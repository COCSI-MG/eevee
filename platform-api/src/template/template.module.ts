import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './entities/template.entity';
import { TemplateParam } from './entities/template-param.entity';
import { AssignmentTemplate } from 'src/assignment/entities/assignment-template.entity';
import { TemplateResourceService } from './template-resource.service';
import { TemplateResourceController } from './template-resource.controller';
import { TemplateResource } from './entities/template-resource.entity';

@Module({
  controllers: [TemplateController, TemplateResourceController],
  providers: [TemplateService, TemplateResourceService],
  exports: [TemplateService, TemplateResourceService],
  imports: [
    TypeOrmModule.forFeature([Template, TemplateResource]),
    TypeOrmModule.forFeature([TemplateParam]),
    TypeOrmModule.forFeature([AssignmentTemplate]),
  ],
})
export class TemplateModule {}
