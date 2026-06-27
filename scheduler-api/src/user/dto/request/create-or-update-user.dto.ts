import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { User } from 'src/user/entities/user.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';

export class CreateOrUpdateUserDto
  implements
    Omit<
      Omit<
        Omit<
          Omit<Omit<Omit<User, 'id'>, 'hashPassword'>, 'userClasses'>,
          'applicants'
        >,
        'passwordHash'
      >,
      'userAttempts'
    >
{
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isAdmin: boolean;
  
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  password: string;
}
