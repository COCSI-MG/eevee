import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { User } from 'src/user/entities/user.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { UserRole } from 'src/user/user-role';

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
  @ApiProperty({ enum: Object.values(UserRole) })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
  
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
