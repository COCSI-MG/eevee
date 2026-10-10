import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { AnswerKeyController } from './answer-key.controller';
import { AnswerKeyService } from './answer-key.service';
import { AnswerKey } from './entities/answer-key.entity';
import { AssignmentAlertModule } from 'src/assignment-alert/assignment-alert.module';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnswerKey, Assignment]),
    AssignmentAlertModule,
  ],
  controllers: [AnswerKeyController],
  providers: [AnswerKeyService, JwtAuthGuard, RolesGuard],
  exports: [AnswerKeyService],
})
export class AnswerKeyModule {}
