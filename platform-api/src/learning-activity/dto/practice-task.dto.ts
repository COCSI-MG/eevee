import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PracticeTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  id!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  prompt!: string;
  @IsString()
  @MaxLength(20000)
  starter!: string;
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  checkSql?: string;
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  expectedRows?: string;
  @IsOptional()
  @IsIn(['base', 'storage'])
  tool?: 'base' | 'storage';
  @IsOptional()
  @IsString()
  @MaxLength(100)
  expectedValue?: string;
  @IsOptional()
  @IsIn([2, 10, 16])
  inputBase?: number;
}
