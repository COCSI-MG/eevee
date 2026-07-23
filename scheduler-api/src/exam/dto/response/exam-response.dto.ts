import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExamResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Midterm' })
  title: string;

  @ApiPropertyOptional({ example: 'Covers chapters 1-5' })
  description?: string;

  @ApiPropertyOptional({ example: 5 })
  classId?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-08-15T23:59:00Z',
  })
  dueDate?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-08-10T08:00:00Z',
  })
  startDate?: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
