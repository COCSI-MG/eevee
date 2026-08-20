import { axiosClientWithAuth } from "./client";
import {
  Scheduling,
  SchedulingPreviewRun,
  SchedulingResponse,
} from "@/app/interface/scheduler-api/scheduling";

export class SchedulingService {
  static async createScheduling(newScheduling: Scheduling) {
    const response = await axiosClientWithAuth.post<SchedulingResponse>(
      "/scheduling/wait",
      newScheduling,
      { timeout: 180_000 },
    );
    return response.data;
  }

  static async createSchedulingInBackground(newScheduling: Scheduling) {
    const response = await axiosClientWithAuth.post("/scheduling/await", newScheduling);
    return response.data;
  }

  static async createPreviewRun(newScheduling: Scheduling) {
    const response = await axiosClientWithAuth.post<SchedulingPreviewRun>(
      "/scheduling/preview",
      newScheduling
    );
    return response.data;
  }

  static async getPreviewRun(previewRunId: number) {
    const response = await axiosClientWithAuth.get<SchedulingPreviewRun>(
      `/scheduling/preview/${previewRunId}`
    );
    return response.data;
  }

  static async cancelPreviewRun(previewRunId: number) {
    const response = await axiosClientWithAuth.delete<SchedulingPreviewRun>(
      `/scheduling/preview/${previewRunId}`
    );
    return response.data;
  }
}
