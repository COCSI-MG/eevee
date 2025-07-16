import { IsNotEmpty, IsString } from "class-validator";

export class CreateAssignmentUserSuspensionDto {
  @IsString()
  @IsNotEmpty()
  userId?: number;

  @IsString()
  @IsNotEmpty()
  assignmentId: number;

  @IsString()
  reason?: string;
}
