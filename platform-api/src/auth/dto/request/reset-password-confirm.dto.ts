import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordConfirmDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
