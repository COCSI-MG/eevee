import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsIn, IsInt, Max, Min } from 'class-validator';
import {
  AssignmentAlertType,
  CONFIGURABLE_ASSIGNMENT_ALERT_TYPES,
} from '../enums/assignment-alert-type.enum';

export class AssignmentAlertPolicyDto {
  @ApiProperty({ default: 5, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  suspensionAlertLimit: number;

  @ApiProperty({ default: 20, minimum: 1, maximum: 1000 })
  @IsInt()
  @Min(1)
  @Max(1000)
  typingCharactersPerSecondLimit: number;

  @ApiProperty({
    enum: CONFIGURABLE_ASSIGNMENT_ALERT_TYPES,
    isArray: true,
  })
  @IsArray()
  @ArrayUnique()
  @IsIn(CONFIGURABLE_ASSIGNMENT_ALERT_TYPES, { each: true })
  punitiveTypes: AssignmentAlertType[];
}
