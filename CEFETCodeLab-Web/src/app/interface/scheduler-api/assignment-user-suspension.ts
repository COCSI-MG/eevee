import { Assignment } from "./assignment";
import { User } from "./user";

export interface AssignmentUserSuspension {
  id: number;
  assignmentId: number;
  userId: number;
  reason?: string;
  createdAt: Date;
  isActive: boolean;
  user: User;
  assignment: Assignment;
}