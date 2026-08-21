import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { AnswerKeyController } from './answer-key.controller';
import { AnswerKeyService } from './answer-key.service';
import { AnswerKey } from './entities/answer-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnswerKey, Assignment])],
  controllers: [AnswerKeyController],
  providers: [AnswerKeyService],
  exports: [AnswerKeyService],
})
export class AnswerKeyModule {}
