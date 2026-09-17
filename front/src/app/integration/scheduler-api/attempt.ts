import {
  AdminAttempt,
  AdminAttemptsListResponse,
  AdminUserAttemptsResponse,
  AdminSubmittedWork
} from "@/app/interface/scheduler-api/admin-attempt";
import { axiosClientWithAuth } from "./client";

interface GetAdminAttemptsParams {
  assignmentId?: number;
  classId?: number;
  userSearch?: string;
  page?: number;
  pageSize?: number;
}

export class AttemptAdminService {
  static async getAdminAttempts(params: GetAdminAttemptsParams) {
    const response = await axiosClientWithAuth.get("/attempt/admin", {
      params,
    });

    return response.data as AdminAttemptsListResponse;
  }

  static async getAdminAttemptById(id: number) {
    const response = await axiosClientWithAuth.get(`/attempt/${id}`);
    return response.data as AdminAttempt;
  }

  static async getAdminAttemptsByAssignmentAndUser(
    assignmentId: number,
    userId: number,
    params: { page?: number; pageSize?: number }
  ) {
    const response = await axiosClientWithAuth.get(
      `/attempt/admin/assignment/${assignmentId}/user/${userId}`,
      { params }
    );

    return response.data as AdminUserAttemptsResponse;
  }

  static async retryAttempt(id: number) {
    const response = await axiosClientWithAuth.post(`/scheduling/retry/${id}`);
    return response.data;
  }

  static async getSubmittedWork(assignmentId: number, userId: number, attemptId: number) {
    const response = await axiosClientWithAuth.get<AdminSubmittedWork>(`/attempt/admin/assignment/${assignmentId}/user/${userId}/attempt/${attemptId}`);

    return response.data;
  }

  static async requestFeedback(attemptId: number): Promise<void> {
    await axiosClientWithAuth.post(`/scheduling/attempt/${attemptId}/feedback`);
  }

  static async getFeedback(
    attemptId: number,
  ): Promise<{ refinedReport: string | null }> {
    const response = await axiosClientWithAuth.get<{
      refinedReport: string | null;
    }>(`/scheduling/attempt/${attemptId}/feedback`);
    return response.data;
  }
}
