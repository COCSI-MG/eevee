import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  isAdmin: boolean;
}