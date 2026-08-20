import { Module } from '@nestjs/common';
import { AssignmentParamsService } from './assignment-params.service';
import { AssignmentParamsController } from './assignment-params.controller';

@Module({
  controllers: [AssignmentParamsController],
  providers: [AssignmentParamsService],
})
export class AssignmentParamsModule {}
