import { CreateExamRequest, Exam, ExamActivity, ExamWithActivities, UpdateExamRequest } from "@/app/interface/scheduler-api/exam";
import { PaginatedResponse } from "@/app/interface/scheduler-api/pagination";
import { axiosClientWithAuth } from "./client";

interface ListByClassParams {
  classId: number;
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: "asc" | "desc";
}

export class ExamService {
  static async listByClass(
    params: ListByClassParams,
  ): Promise<PaginatedResponse<Exam>> {
    const { classId, ...queryParams } = params;
    const response = await axiosClientWithAuth.get<PaginatedResponse<Exam>>(
      `/exam/class/${classId}`,
      { params: queryParams },
    );
    return response.data;
  }

  static async create(data: CreateExamRequest): Promise<Exam> {
    const response = await axiosClientWithAuth.post<Exam>("/exam", data);
    return response.data;
  }

  static async update(id: number, data: UpdateExamRequest): Promise<Exam> {
    const response = await axiosClientWithAuth.patch<Exam>(
      `/exam/${id}`,
      data,
    );
    return response.data;
  }

  static async remove(id: number): Promise<void> {
    await axiosClientWithAuth.delete(`/exam/${id}`);
  }

  static async getOne(id: number): Promise<ExamWithActivities> {
    const response = await axiosClientWithAuth.get<ExamWithActivities>(
      `/exam/${id}`,
    );
    return response.data;
  }

  static async linkActivity(
    examId: number,
    assignmentId: number,
  ): Promise<ExamActivity> {
    const response = await axiosClientWithAuth.post<ExamActivity>(
      `/exam/${examId}/assignments/${assignmentId}`,
    );
    return response.data;
  }

  static async unlinkActivity(
    examId: number,
    assignmentId: number,
  ): Promise<void> {
    await axiosClientWithAuth.delete(
      `/exam/${examId}/assignments/${assignmentId}`,
    );
  }
}
