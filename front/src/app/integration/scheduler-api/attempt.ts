import {
  AdminAttempt,
  AdminAttemptsListResponse,
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

  static async retryAttempt(id: number) {
    const response = await axiosClientWithAuth.post(`/scheduling/retry/${id}`);
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
