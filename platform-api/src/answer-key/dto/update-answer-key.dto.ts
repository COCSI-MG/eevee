import { PartialType } from '@nestjs/mapped-types';
import { CreateAnswerKeyDto } from './create-answer-key.dto';

export class UpdateAnswerKeyDto extends PartialType(CreateAnswerKeyDto) {}
