import { Class } from "@/app/interface/scheduler-api/class";
import { axiosClientWithAuth } from "./client";

export class ClassesService {
  static async listClasses(): Promise<Class[]> {
    return (await axiosClientWithAuth.get("/class")).data;
  }
}
