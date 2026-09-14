import { axiosClientWithAuth } from "./client";
import {
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
} from "@/app/interface/scheduler-api/assignment";
import { PaginatedResponse } from "@/app/interface/scheduler-api/pagination";
import { AdminAttemptAssignmentOption } from "@/app/interface/scheduler-api/admin-attempt";

interface ListPaginatedAssignmentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export class AssignmentService {
  static async listOptions(
    classId?: number,
  ): Promise<AdminAttemptAssignmentOption[]> {
    const response = await axiosClientWithAuth.get<AdminAttemptAssignmentOption[]>("/assignment/options", {
      params: classId ? { classId } : undefined,
    });

    return response.data;
  }

  static async GetMyAssignments() {
    const response = await axiosClientWithAuth.get("/assignment/me");

    return <Assignment[]>response.data;
  }

  static async GetAssignmentsAdmin() {
    const response = await axiosClientWithAuth.get("/assignment");

    return <Assignment[]>response.data;
  }

  static async GetAssignmentById(id: number) {
    console.log("id", id);
    const response = await axiosClientWithAuth.get(`/assignment/${id}`);

    console.log("response", response);

    return <Assignment>response.data;
  }

  static async CreateAssignment(data: CreateAssignmentRequest) {
    const response = await axiosClientWithAuth.post("/assignment", data);

    return <Assignment>response.data;
  }

  static async UpdateAssignment(id: number, data: UpdateAssignmentRequest) {
    const response = await axiosClientWithAuth.patch(`/assignment/${id}`, data);

    return <Assignment>response.data;
  }

  static async DeleteAssignment(id: number) {
    const response = await axiosClientWithAuth.delete(`/assignment/${id}`);
    return <Assignment>response.data;
  }

  static async GetAssignmentsByClassId(classId: number) {
    const response = await axiosClientWithAuth.get(
      `/assignment/class/${classId}`
    );
    return <Assignment[]>response.data;
  }

  static async getLinkableByClassId(classId: number): Promise<Assignment[]> {
    const response = await axiosClientWithAuth.get<Assignment[]>(
      `/assignment/class/${classId}`,
      { params: { linkedToExam: false } },
    );
    return response.data;
  }

  static async listPaginated(params: ListPaginatedAssignmentsParams) {
    const response = await axiosClientWithAuth.get<
      PaginatedResponse<Assignment>
    >("/assignment/paginated", {
      params,
    });
    return response.data;
  }
}
