import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateAssignmentUserSuspensionDto {
  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsNumber()
  @IsNotEmpty()
  assignmentId: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
