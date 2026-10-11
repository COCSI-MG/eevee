import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
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
    ]),
    RequestContextModule,
  ],
  controllers: [AssignmentAlertController],
  providers: [AssignmentAlertService, JwtAuthGuard, RolesGuard],
  exports: [AssignmentAlertService]
})
export class AssignmentAlertModule {}
