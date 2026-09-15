import {
  Class,
  ClassOption,
  UpsertClass
} from "@/app/interface/scheduler-api/class";
import { PaginatedResponse } from "@/app/interface/scheduler-api/pagination";
import { axiosClientWithAuth } from "./client";

interface ListPaginatedClassesParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export class ClassesService {
  static async listOptions(): Promise<ClassOption[]> {
    const response = await axiosClientWithAuth.get<ClassOption[]>("/class/options");

    return response.data;
  }

  static async listClasses(): Promise<Class[]> {
    return (await axiosClientWithAuth.get("/class")).data;
  }

  static async listClassesByUserId(userId: number): Promise<Class[]> {
    return (await axiosClientWithAuth.get(`/class/user/${userId}`)).data;
  }

  static async getOne(id: number): Promise<Class> {
    const request = await axiosClientWithAuth.get(`/class/${id}`);
    return request.data;
  }

  static async create(classData: UpsertClass): Promise<Class> {
    const request = await axiosClientWithAuth.post("/class", classData);
    return request.data;
  }

  static async update(classData: UpsertClass): Promise<Class> {
    const request = await axiosClientWithAuth.patch(
      `/class/${classData.id}`,
      classData
    );
    return request.data;
  }

  static async remove(id: number): Promise<void> {
    return await axiosClientWithAuth.delete(`/class/${id}`);
  }

  static async listPaginated(
    params: ListPaginatedClassesParams,
  ): Promise<PaginatedResponse<Class>> {
    const response = await axiosClientWithAuth.get<PaginatedResponse<Class>>(
      "/class/paginated",
      { params },
    );
    return response.data;
  }
}
