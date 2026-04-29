import { UpsertUser, User } from "@/app/interface/scheduler-api/user";
import { PaginatedResponse } from "@/app/interface/scheduler-api/pagination";
import { axiosClientWithAuth } from "./client";

interface GetPaginatedUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

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

  static async deleteUser(id: number) {
    const response = await axiosClientWithAuth.delete(`/user/${id}`);
    return response.data;
  }

  static async getPaginatedUsers(params: GetPaginatedUsersParams) {
    const response = await axiosClientWithAuth.get<PaginatedResponse<User>>(
      "/user/paginated",
      { params },
    );
    return response.data;
  }
}