import { AuthResponse } from "@/app/interface/scheduler-api/auth";
import { axiosClient } from "./client";

export class LoginService {
  static async login(email: string, password: string) {
    const response = await axiosClient.post("/auth/login", {
      email,
      password,
    });

    return <AuthResponse>response.data;
  }
}
