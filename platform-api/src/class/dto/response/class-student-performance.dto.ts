import { ApiProperty } from '@nestjs/swagger';
import { ClassActivityGradeDto } from './class-activity-grade.dto';

export class ClassStudentPerformanceDto {

  @ApiProperty()
  userId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    type: [ClassActivityGradeDto]
  })
  grades: ClassActivityGradeDto[];

  @ApiProperty({
    nullable: true,
    type: Number
  })
  average: number | null;
}
