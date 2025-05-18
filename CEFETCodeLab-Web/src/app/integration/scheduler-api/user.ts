import { UpsertUser, User } from "@/app/interface/scheduler-api/user";
import { axiosClientWithAuth } from "./client";

export class UsersService {
  static async getAllUsers() {
    const response = await axiosClientWithAuth.get<User[]>("/user");
    return response.data;
  }

  static async getUserById(id: number) {
    const response = await axiosClientWithAuth.get<User>(`/user/${id}`);
    return response.data;
  }

  static async upsertUser(user: UpsertUser) {
    const response = await axiosClientWithAuth.post<User>("/user", user);
    return response.data;
  }
}