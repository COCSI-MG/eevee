import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { AssignmentAlertDetails } from '../entities/assignment-user-alert.entity';
import {
  AssignmentAlertType,
  CONFIGURABLE_ASSIGNMENT_ALERT_TYPES,
} from '../enums/assignment-alert-type.enum';

export class CreateAssignmentUserAlertDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  eventId: string;

  @ApiProperty({ enum: CONFIGURABLE_ASSIGNMENT_ALERT_TYPES })
  @IsIn(CONFIGURABLE_ASSIGNMENT_ALERT_TYPES)
  type: AssignmentAlertType;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  details?: AssignmentAlertDetails;

  @ApiPropertyOptional({ minimum: 0, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  measuredCharactersPerSecond?: number;
}
