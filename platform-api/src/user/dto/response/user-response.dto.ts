import { ApiProperty } from '@nestjs/swagger';
import { UserClassResponseDto } from 'src/user-class/dto/response/user-class-response.dto';
import { UserRole } from 'src/user/user-role';

export class UserResponseDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  email: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ enum: Object.values(UserRole) })
  role: UserRole;
  @ApiProperty({ type: [UserClassResponseDto] })
  userClasses?: UserClassResponseDto[];
}
