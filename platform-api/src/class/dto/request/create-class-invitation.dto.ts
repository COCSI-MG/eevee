import { IsDateString, IsOptional } from 'class-validator';

export class CreateClassInvitationDto {
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}
