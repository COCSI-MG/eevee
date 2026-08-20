import { ApiProperty } from '@nestjs/swagger';

export class AuthSessionResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  isAdmin: boolean;
}
