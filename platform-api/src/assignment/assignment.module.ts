import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { AssignmentTemplate } from './entities/assignment-template.entity';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { ClassModule } from 'src/class/class.module';
import { AssignmentParam } from './entities/assignment-param.entity';
import { Template } from 'src/template/entities/template.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { AnswerKey } from 'src/answer-key/entities/answer-key.entity';
import { AssignmentAlertModule } from 'src/assignment-alert/assignment-alert.module';
import { TemplateParam } from 'src/template/entities/template-param.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [AssignmentController],
  imports: [
    TypeOrmModule.forFeature([Assignment]),
    TypeOrmModule.forFeature([AssignmentTemplate]),
    TypeOrmModule.forFeature([AssignmentParam]),
    TypeOrmModule.forFeature([Template]),
    TypeOrmModule.forFeature([TemplateParam]),
    TypeOrmModule.forFeature([Attempt]),
    TypeOrmModule.forFeature([AnswerKey]),
    RequestContextModule,
    ClassModule,
    AssignmentAlertModule
  ],
  providers: [AssignmentService, JwtAuthGuard, RolesGuard],
  exports: [AssignmentService],
})
export class AssignmentModule {}
