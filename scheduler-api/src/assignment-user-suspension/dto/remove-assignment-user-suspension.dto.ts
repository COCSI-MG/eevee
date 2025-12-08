import { IsNotEmpty, IsNumber } from "class-validator";

export class RemoveAssignmentUserSuspensionDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  assignmentId: number;
}