import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsNotBlank } from 'src/common/decorators/is-not-blank.decorator';
import { NoSpecialCharacters } from 'src/common/decorators/no-special-characters.decorator';

export class RegisterRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotBlank()
  @NoSpecialCharacters()
  name: string;
}