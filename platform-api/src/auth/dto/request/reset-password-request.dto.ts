import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResetPasswordRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
