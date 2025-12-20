import { AssignmentUserSuspension } from "@/app/interface/scheduler-api/assignment-user-suspension";
import { axiosClientWithAuth } from "./client";

export class AssignmentUserSuspensionService {
  static async isUserSuspended(
    assignmentId: number
  ) {
    const res = await axiosClientWithAuth.get(`assignment-user-suspension/is-suspended/${assignmentId}`);
    return res.data as { message: string, suspended: boolean };
  }

  static async suspendUserFromAssignment(
    assignmentId: number,
    reason?: string
  ) {
    const res = await axiosClientWithAuth.post(`assignment-user-suspension/suspend`, {
      assignmentId,
      reason,
    });
    return res.data;
  }

  static async removeSuspensionFromAssignment(
    userId: number,
    assignmentId: number
  ) {
    const res = await axiosClientWithAuth.post(`assignment-user-suspension/remove-suspension`, {
      userId,
      assignmentId,
    });
    return res.data;
  }

  static async getSuspensionsByAssignmentId(assignmentId: number) {
    const res = await axiosClientWithAuth.get(`assignment-user-suspension/assignment/${assignmentId}`);
    return <AssignmentUserSuspension[]>res.data;
  }
}