import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsNotBlank } from 'src/common/decorators/is-not-blank.decorator';
import { NoSpecialCharacters } from 'src/common/decorators/no-special-characters.decorator';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { AssignmentExecutionMode } from '../enums/assignment-execution-mode.enum';
import { AssignmentAlertPolicyDto } from 'src/assignment-alert/dto/assignment-alert-policy.dto';

export class TemplateParamDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  templateParamId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class AssignmentTemplateDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  templateId: number;

  @ApiProperty({ type: [TemplateParamDto] })
  @ValidateNested({ each: true })
  @Type(() => TemplateParamDto)
  params: TemplateParamDto[];

  @ApiProperty({ required: false, description: 'Weight of this template as a percentage of the assignment total grade (0-100). When omitted the backend normalizes weights automatically.' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  weight?: number;
}

export class CreateAssignmentDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  classId: number;

  @ApiProperty()
  @IsString()
  @IsNotBlank()
  @NoSpecialCharacters()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotBlank()
  description: string;

  @ApiProperty()
  @IsNumber()
  maxAttempts: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'When the assignment becomes visible to students.',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Last instant when students may submit a graded attempt.',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
  @ApiProperty({
    description:
      'Allows copy and paste of content originating from within the assignment workspace.',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allowCopyPaste?: boolean;

  @ApiPropertyOptional({ type: () => AssignmentAlertPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AssignmentAlertPolicyDto)
  alertPolicy?: AssignmentAlertPolicyDto;

  @ApiProperty()
  @IsEnum(WorkerType)
  workerType: WorkerType;

  @ApiPropertyOptional({ enum: AssignmentExecutionMode, default: AssignmentExecutionMode.GRADED })
  @IsOptional()
  @IsEnum(AssignmentExecutionMode)
  executionMode?: AssignmentExecutionMode;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Allows students to import their latest submitted project from a compatible assignment into this assignment.'
  })
  @IsOptional()
  @IsBoolean()
  allowProjectImport?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  validationScript: string;

  @ApiProperty({
    description:
      'Boilerplate code provided by the teacher. Persisted in assignment.boilerplateContent. Prefer this field; validationScript is kept for backward compatibility.',
    required: false,
  })
  @IsOptional()
  @IsString()
  boilerplate?: string;

  @ApiProperty({
    description:
      'Boilerplate code content stored directly in the assignment.boilerplateContent database column.',
    required: false,
  })
  @IsOptional()
  @IsString()
  boilerplateContent?: string;

  @ApiProperty({
    description:
      'SQL script to initialize the database schema/seed data for PostgreSQL-backed workers.',
    required: false,
  })
  @IsOptional()
  @IsString()
  initSqlScript?: string;

  @ApiProperty({ type: [AssignmentTemplateDto] })
  @ValidateNested({ each: true })
  @Type(() => AssignmentTemplateDto)
  templates: AssignmentTemplateDto[];
}
