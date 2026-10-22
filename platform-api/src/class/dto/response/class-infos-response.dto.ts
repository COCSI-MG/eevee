import { ApiProperty } from '@nestjs/swagger';
import { ClassActivityOptionDto } from './class-activity-option.dto';

export class ClassInfosResponseDto {

  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    nullable: true,
    type: String
  })
  description: string | null;

  @ApiProperty({
    nullable: true,
    type: Date
  })
  deletedAt: Date | null;

  @ApiProperty({
    type: [ClassActivityOptionDto]
  })
  activities: ClassActivityOptionDto[];
}
