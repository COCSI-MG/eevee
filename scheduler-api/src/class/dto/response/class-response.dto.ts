import { ApiProperty } from '@nestjs/swagger';
import { Class } from 'src/class/entities/class.entity';
import { UserClassResponseDto } from 'src/user-class/dto/response/user-class-response.dto';

export class ClassResponseDto
  implements Omit<Omit<Class, 'assignments'>, 'userClasses'> {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;
  @ApiProperty()
  users: Omit<UserClassResponseDto, 'classes'>[];
}
