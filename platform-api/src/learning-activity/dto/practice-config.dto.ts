import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PracticeLab } from '../enums/practice-lab.enum';
import { PracticeTaskDto } from './practice-task.dto';

export class PracticeConfigDto {
  @IsIn(Object.values(PracticeLab))
  lab!: PracticeLab;
  @IsString()
  @MaxLength(50000)
  setupSql!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => PracticeTaskDto)
  tasks!: PracticeTaskDto[];
}
