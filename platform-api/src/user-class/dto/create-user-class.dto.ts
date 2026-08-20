import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { UserClass } from '../entities/user-class.entity';

export class CreateUserClassDto
  implements Omit<Omit<Omit<UserClass, 'id'>, 'user'>, 'class'>
{
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  classId: number;
}
