import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './entities/template.entity';
import { TemplateParam } from 'src/template-params/entities/template-param.entity';
import { AssignmentTemplate } from 'src/assignment-template/entities/assignment_template.entity';

@Module({
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
  imports: [
    TypeOrmModule.forFeature([Template]),
    TypeOrmModule.forFeature([TemplateParam]),
    TypeOrmModule.forFeature([AssignmentTemplate]),
  ],
})
export class TemplateModule {}
