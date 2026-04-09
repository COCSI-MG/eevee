import {
  AdminAttempt,
  AdminAttemptsListResponse,
} from "@/app/interface/scheduler-api/admin-attempt";
import { axiosClientWithAuth } from "./client";

interface GetAdminAttemptsParams {
  assignmentId: number;
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
}
