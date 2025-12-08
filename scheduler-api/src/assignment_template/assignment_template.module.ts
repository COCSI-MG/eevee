import { Module } from '@nestjs/common';
import { AssignmentTemplateService } from './assignment_template.service';
import { AssignmentTemplateController } from './assignment_template.controller';

@Module({
  controllers: [AssignmentTemplateController],
  providers: [AssignmentTemplateService],
})
export class AssignmentTemplateModule {}
