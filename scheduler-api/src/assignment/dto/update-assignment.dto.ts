import { PartialType } from '@nestjs/mapped-types';
<<<<<<< HEAD:CEFETCodeLab-SchedulerApi/src/assignment/dto/update-assignment.dto.ts
import { CreateAssignmentDto } from './create-assignment.dto';

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}
=======
import { AssignmentTemplateDto, CreateAssignmentDto } from './create-assignment.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NoSpecialCharacters } from 'src/common/decorators/no-special-characters.decorator';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { Type } from 'class-transformer';
import { IsNotBlank } from 'src/common/decorators/is-not-blank.decorator';

export class UpdateAssignmentDto {
     @IsOptional()
     @ApiProperty()
      @IsNumber()
      @IsNotEmpty()
      classId: number;
    
      @IsOptional()
      @ApiProperty()
      @IsString()
      @IsNotBlank()
      @NoSpecialCharacters()
      title: string;

       @IsOptional()
      @ApiProperty()
      @IsString()
      @IsNotBlank()
      description: string;
    
    @IsOptional()
      @ApiProperty()
      @IsNumber()
      maxAttempts: number;
    
     @IsOptional()
      @ApiProperty()
      @IsEnum(WorkerType)
      workerType: WorkerType;

       @IsOptional()
      @ApiProperty({ type: [AssignmentTemplateDto] })
      @ValidateNested({ each: true })
      @Type(() => AssignmentTemplateDto)
      templates: AssignmentTemplateDto[];

      @IsOptional()
      @ApiProperty({
        description:
          'Boilerplate code provided by the teacher (stored as a server-side file).',
        required: false,
      })
      @IsString()
      validationScript?: string;

      @IsOptional()
      @ApiProperty({
        description:
          'Boilerplate code provided by the teacher (stored as a server-side file). Prefer this field; validationScript is kept for backward compatibility.',
        required: false,
      })
      @IsString()
      boilerplate?: string;
}
>>>>>>> origin/develop:scheduler-api/src/assignment/dto/update-assignment.dto.ts
