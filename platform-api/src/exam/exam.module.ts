import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { ClassModule } from 'src/class/class.module';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { User } from 'src/user/entities/user.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { UserClassModule } from 'src/user-class/user-class.module';
import { ExamAssignment } from './entities/exam-assignment.entity';
import { Exam } from './entities/exam.entity';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { AssignmentAlertModule } from 'src/assignment-alert/assignment-alert.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamAssignment, Assignment, User, Attempt, UserClass]),
    ClassModule,
    UserClassModule,
    RequestContextModule,
    AssignmentModule,
    AssignmentAlertModule
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
