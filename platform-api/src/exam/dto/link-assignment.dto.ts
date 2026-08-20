import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class LinkAssignmentDto {
  @ApiProperty({ minimum: 0.01, description: 'Points this activity is worth within the exam', example: 3 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  score: number;
}
