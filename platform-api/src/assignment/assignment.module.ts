import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { AssignmentTemplate } from 'src/assignment-template/entities/assignment-template.entity';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { ClassModule } from 'src/class/class.module';
import { AssignmentParam } from 'src/assignment-params/entities/assignment-param.entity';
import { Template } from 'src/template/entities/template.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { AnswerKey } from 'src/answer-key/entities/answer-key.entity';
import { AssignmentAlertModule } from 'src/assignment-alert/assignment-alert.module';

@Module({
  controllers: [AssignmentController],
  imports: [
    TypeOrmModule.forFeature([Assignment]),
    TypeOrmModule.forFeature([UserClass]),
    TypeOrmModule.forFeature([AssignmentTemplate]),
    TypeOrmModule.forFeature([AssignmentParam]),
    TypeOrmModule.forFeature([Template]),
    TypeOrmModule.forFeature([Attempt]),
    TypeOrmModule.forFeature([AnswerKey]),
    RequestContextModule,
    ClassModule,
    AssignmentAlertModule
  ],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
