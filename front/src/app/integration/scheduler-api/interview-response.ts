import {
  InterviewResponse,
  InterviewResponsePayload,
} from '@/app/interface/scheduler-api/interview-response';
import { axiosClientWithAuth } from './client';

export class InterviewResponseService {
  static async upsert(payload: InterviewResponsePayload) {
    const response = await axiosClientWithAuth.post('/interview-response', payload);
    return response.data as InterviewResponse;
  }

  static async findMineByAssignmentId(assignmentId: number) {
    const response = await axiosClientWithAuth.get(
      `/interview-response/assignment/${assignmentId}/me`,
    );
    return response.data as InterviewResponse | null;
  }
}
