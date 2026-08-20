import { IsNumber, IsPositive } from 'class-validator';
import { CreateAssignmentDto } from 'src/assignment/dto/create-assignment.dto';

export class CreateAndLinkAssignmentDto extends CreateAssignmentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  score: number;
}
