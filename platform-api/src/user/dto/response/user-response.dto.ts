import { ApiProperty } from '@nestjs/swagger';
import { UserClassResponseDto } from 'src/user-class/dto/response/user-class-response.dto';

export class UserResponseDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  email: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ type: [UserClassResponseDto] })
  userClasses?: UserClassResponseDto[];
}
