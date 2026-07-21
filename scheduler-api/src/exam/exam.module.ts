import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentModule } from 'src/assignment/assignment.module';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { ClassModule } from 'src/class/class.module';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { UserClassModule } from 'src/user-class/user-class.module';
import { ExamActivity } from './entities/exam-activity.entity';
import { Exam } from './entities/exam.entity';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamActivity, Assignment]),
    ClassModule,
    UserClassModule,
    RequestContextModule,
    AssignmentModule,
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
