import { Module } from '@nestjs/common';
import { AssignmentParamsService } from './assignment_params.service';
import { AssignmentParamsController } from './assignment_params.controller';

@Module({
  controllers: [AssignmentParamsController],
  providers: [AssignmentParamsService],
})
export class AssignmentParamsModule {}
