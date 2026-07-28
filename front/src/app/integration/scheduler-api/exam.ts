import { CreateExamRequest, Exam, ExamAssignment, ExamWithAssignments, UpdateExamRequest } from "@/app/interface/scheduler-api/exam";
import { ExamStudentGrades } from "@/app/interface/scheduler-api/exam-student-grades";
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

  static async getOne(id: number): Promise<ExamWithAssignments> {
    const response = await axiosClientWithAuth.get<ExamWithAssignments>(
      `/exam/${id}`,
    );
    return response.data;
  }

  static async linkAssignment(
    examId: number,
    assignmentId: number,
    score: number,
  ): Promise<ExamAssignment> {
    const response = await axiosClientWithAuth.post<ExamAssignment>(
      `/exam/${examId}/assignments/${assignmentId}`,
      { score },
    );
    return response.data;
  }

  static async unlinkAssignment(
    examId: number,
    assignmentId: number,
  ): Promise<void> {
    await axiosClientWithAuth.delete(
      `/exam/${examId}/assignments/${assignmentId}`,
    );
  }

  static async updateAssignmentScore(
    examId: number,
    assignmentId: number,
    score: number,
  ): Promise<ExamAssignment> {
    const response = await axiosClientWithAuth.patch<ExamAssignment>(
      `/exam/${examId}/assignments/${assignmentId}`,
      { score },
    );
    return response.data;
  }

  static async listStudents(
    examId: number,
    params: { page?: number; pageSize?: number; search?: string },
  ): Promise<PaginatedResponse<ExamStudentGrades>> {
    const response = await axiosClientWithAuth.get<PaginatedResponse<ExamStudentGrades>>(
      `/exam/${examId}/student`,
      { params },
    );
    return response.data;
  }
}
