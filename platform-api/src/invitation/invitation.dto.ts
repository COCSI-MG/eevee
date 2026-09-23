import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
export class CreateInvitationDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  classIds: number[];
}
export class InvitationTokenDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) token: string;
}
export class AcceptInvitationDto extends InvitationTokenDto {
  @IsString() @MinLength(1) @MaxLength(72) password: string;
}
