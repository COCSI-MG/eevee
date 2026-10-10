import { ApiProperty } from '@nestjs/swagger';
import { Class } from 'src/class/entities/class.entity';
import { UserClassResponseDto } from 'src/user-class/dto/response/user-class-response.dto';

export class ClassResponseDto
  implements
    Omit<Omit<Omit<Class, 'assignments'>, 'userClasses'>, 'exams'> {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;
  @ApiProperty({ required: false, nullable: true })
  teacherId?: number | null;
  @ApiProperty({ required: false, nullable: true })
  deletedAt?: Date | null;
  @ApiProperty()
  users: Omit<UserClassResponseDto, 'classes'>[];
}
