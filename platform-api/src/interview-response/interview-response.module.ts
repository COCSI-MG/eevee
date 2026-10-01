import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { InterviewResponseController } from './interview-response.controller';
import { InterviewResponseService } from './interview-response.service';
import { InterviewResponse } from './entities/interview-response.entity';
import { AssignmentAlertModule } from 'src/assignment-alert/assignment-alert.module';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([InterviewResponse, Assignment, Attempt]),
    RequestContextModule,
    AssignmentAlertModule
  ],
  providers: [InterviewResponseService, JwtAuthGuard, RolesGuard],
  controllers: [InterviewResponseController],
  exports: [InterviewResponseService],
})
export class InterviewResponseModule {}
