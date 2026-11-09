import { axiosClientWithAuth } from "./client";
import {
  Scheduling,
  SchedulingPreviewRun,
  SchedulingResponse,
} from "@/app/interface/platform-api/scheduling";

import { prepareAnswerKeyRun, prepareStorageSubmission } from "../file-storage-api/source-storage";

export class SchedulingService {
  static async runAnswerKey(newScheduling: Scheduling, userId: number) {
    const response = await axiosClientWithAuth.post<SchedulingResponse>(
      "/scheduling/answer-key/run",
      await prepareAnswerKeyRun(newScheduling, userId),
      { timeout: 180_000 },
    );
    return response.data;
  }

  static async createSchedulingInBackground(newScheduling: Scheduling) {
    const response = await axiosClientWithAuth.post(
      "/scheduling/await",
      await prepareStorageSubmission(newScheduling, "submission"),
    );
    return response.data;
  }

  static async createPreviewRun(newScheduling: Scheduling) {
    const response = await axiosClientWithAuth.post<SchedulingPreviewRun>(
      "/scheduling/preview",
      await prepareStorageSubmission(newScheduling, "preview"),
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
