import { ApiProperty } from '@nestjs/swagger';

export class ClassActivityOptionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;
}
