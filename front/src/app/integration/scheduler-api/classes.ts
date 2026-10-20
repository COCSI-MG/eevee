import {
  Class,
  ClassOption,
  ClassStatusFilter,
  UpsertClass
} from "@/app/interface/scheduler-api/class";
import { PaginatedResponse } from "@/app/interface/scheduler-api/pagination";
import { axiosClientWithAuth } from "./client";
import { ClassInfos, ClassPerformance, ClassPerformanceParams } from "@/app/interface/scheduler-api/class-performance";

interface ListPaginatedClassesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  includeArchived?: boolean;
  status?: ClassStatusFilter;
}

export class ClassesService {
  static async getInfos(id: number, signal?: AbortSignal): Promise<ClassInfos> {
    const response = await axiosClientWithAuth.get<ClassInfos>(`/class/${id}/infos`, { signal });
    return response.data;
  }

  static async getPerformance(
    id: number,
    params: ClassPerformanceParams,
    signal?: AbortSignal
  ): Promise<ClassPerformance> {
    const response = await axiosClientWithAuth.get<ClassPerformance>(`/class/${id}/performance`, {
      params: {
        ...params,
        activityIds: params.activityIds?.join(',')
      },
      signal,
    });
    return response.data;
  }

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

  static async restore(id: number): Promise<Class> {
    const response = await axiosClientWithAuth.patch(`/class/${id}/restore`)
    return response.data
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
