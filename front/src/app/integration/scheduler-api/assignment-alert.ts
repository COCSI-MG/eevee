import {
  ArchiveAssignmentAlertResponse,
  AssignmentAlertStatus,
  AssignmentAlertUserSummary,
  AssignmentUserAlert,
  RecordAssignmentAlertRequest,
  RecordAssignmentAlertResponse,
} from "@/app/interface/scheduler-api/assignment-alert";
import { PaginatedResponse } from "@/app/interface/scheduler-api/pagination";
import { axiosClientWithAuth } from "./client";

export class AssignmentAlertService {
  static async record(
    assignmentId: number,
    data: RecordAssignmentAlertRequest
  ) {
    const response = await axiosClientWithAuth.post<RecordAssignmentAlertResponse>(`/assignment/${assignmentId}/alerts`, data);
    return response.data;
  }

  static async getMyStatus(assignmentId: number) {
    const response = await axiosClientWithAuth.get<AssignmentAlertStatus>(`/assignment/${assignmentId}/alerts/me/status`);

    return response.data;
  }

  static async listUsers(
    assignmentId: number,
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
    } = {}
  ) {
    const response = await axiosClientWithAuth.get<PaginatedResponse<AssignmentAlertUserSummary>>(`/assignment/${assignmentId}/alerts/admin/users`, { params });

    return response.data;
  }

  static async listUserHistory(
    assignmentId: number,
    userId: number,
    params: { page?: number; pageSize?: number; status?: string } = {}
  ) {
    const response = await axiosClientWithAuth.get<PaginatedResponse<AssignmentUserAlert>>(`/assignment/${assignmentId}/alerts/admin/users/${userId}`, { params });

    return response.data;
  }

  static async archiveAlert(
    assignmentId: number,
    userId: number,
    alertId: number
  ) {
    const response = await axiosClientWithAuth.post<ArchiveAssignmentAlertResponse>(`/assignment/${assignmentId}/alerts/admin/users/${userId}/alerts/${alertId}/archive`);

    return response.data;
  }
}
