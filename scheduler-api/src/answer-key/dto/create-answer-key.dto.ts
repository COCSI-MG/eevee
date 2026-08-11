import { ApiProperty } from '@nestjs/swagger';
import {
  IsObject,
} from 'class-validator';
import { AnswerKeyContent } from '../entities/answer-key.entity';

export class CreateAnswerKeyDto {
  @ApiProperty({ type: Object })
  @IsObject()
  content: AnswerKeyContent;
}
