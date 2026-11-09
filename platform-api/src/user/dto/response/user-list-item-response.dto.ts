import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/user/user-role';

export class UserListItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Object.values(UserRole) })
  role: UserRole;
}
