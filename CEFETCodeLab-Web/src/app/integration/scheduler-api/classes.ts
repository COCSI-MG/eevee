import { Class, UpsertClass } from "@/app/interface/scheduler-api/class";
import { axiosClientWithAuth } from "./client";

export class ClassesService {
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
    const request = await axiosClientWithAuth.post(`/class/${classData.id}`, classData);
    return request.data;
  }
}
