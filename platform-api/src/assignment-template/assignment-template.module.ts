import { Module } from '@nestjs/common';
import { AssignmentTemplateService } from './assignment-template.service';
import { AssignmentTemplateController } from './assignment-template.controller';

@Module({
  controllers: [AssignmentTemplateController],
  providers: [AssignmentTemplateService],
})
export class AssignmentTemplateModule {}
