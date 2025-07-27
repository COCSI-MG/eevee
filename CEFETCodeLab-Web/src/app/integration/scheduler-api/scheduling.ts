import { axiosClientWithAuth } from "./client";
import {
  Scheduling,
  SchedulingResponse,
} from "@/app/interface/scheduler-api/scheduling";

export class SchedulingService {
  static async createScheduling(newScheduling: Scheduling) {
    const response = await axiosClientWithAuth.post<SchedulingResponse>(
      "/scheduling/wait",
      newScheduling
    );
    return response.data;
  }

  static async createSchedulingInBackground(newScheduling: Scheduling) {
    const response = await axiosClientWithAuth.post("/scheduling/await", newScheduling);
    return response.data;
  }
}
