import { AuthResponse, RegisterRequest } from "@/app/interface/scheduler-api/auth";
import { axiosClient } from "./client";

export class RegisterService {
    static async register({ email, name, password }: RegisterRequest) {
        const response = await axiosClient.post("/auth/register", {
            name,
            email,
            password,
        });

        return <AuthResponse>response.data;
    }
}
