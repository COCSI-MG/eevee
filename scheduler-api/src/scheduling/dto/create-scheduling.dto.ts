import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';

export class CreateSchedulingDto extends CreateWorkerDto {
  @ApiProperty()
  @IsNumber()
  @Min(1, { message: 'assignmentId must be greater than zero' })
  assignmentId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  applicationFileContent: string;
}
