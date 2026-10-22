import { ApiProperty } from '@nestjs/swagger';

export class ClassActivityGradeDto {
  @ApiProperty() activityId: number;
  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Nota de 0 a 10 da tentativa finalizada mais recente, 0 em caso de falha e null quando não houver tentativa finalizada.'
  })
  grade: number | null;
}
