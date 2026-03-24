import { ApiProperty } from '@nestjs/swagger';
import { ClassResponseDto } from 'src/class/dto/response/class-response.dto';

export class UserClassResponseDto {
  @ApiProperty()
  userId: number;
  @ApiProperty({ type: [ClassResponseDto] })
  classes: ClassResponseDto[];
}
