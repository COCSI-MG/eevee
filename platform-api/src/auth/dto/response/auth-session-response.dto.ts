import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/user/user-role';

export class AuthSessionResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Object.values(UserRole) })
  role: UserRole;

  @ApiProperty({ description: 'Segundos restantes até o token de acesso vencer' })
  expiresIn: number;
}
