import { PartialType } from '@nestjs/mapped-types';
import { AssignmentTemplateDto, CreateAssignmentDto } from './create-assignment.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
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
}