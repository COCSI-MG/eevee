import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { AssignmentAlertController } from './assignment-alert.controller';
import { AssignmentAlertService } from './assignment-alert.service';
import { AssignmentAlertRule } from './entities/assignment-alert-rule.entity';
import { AssignmentUserAlert } from './entities/assignment-user-alert.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assignment,
      AssignmentAlertRule,
      AssignmentUserAlert,
      UserClass,
    ]),
    RequestContextModule,
  ],
  controllers: [AssignmentAlertController],
  providers: [AssignmentAlertService],
  exports: [AssignmentAlertService]
})
export class AssignmentAlertModule {}
