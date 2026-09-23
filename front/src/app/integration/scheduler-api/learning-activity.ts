import { axiosClientWithAuth as api } from "./client";
import {
  LearningActivity,
  QuizAttempt,
} from "@/app/interface/scheduler-api/learning-activity";
export const LearningActivities = {
  list: async (classId: number): Promise<LearningActivity[]> =>
    (await api.get(`/learning-activity/class/${classId}`)).data,
  get: async (id: number): Promise<LearningActivity> =>
    (await api.get(`/learning-activity/${id}`)).data,
  save: async (activity: LearningActivity): Promise<LearningActivity> => {
    const { id, ...body } = activity;
    return (
      await (id
        ? api.put(`/learning-activity/${id}`, body)
        : api.post("/learning-activity", body))
    ).data;
  },
  attempts: async (id: number): Promise<QuizAttempt[]> =>
    (await api.get(`/learning-activity/${id}/attempts`)).data,
  submit: async (
    id: number,
    answers: { questionId: string; choiceId: string }[],
  ) => (await api.post(`/learning-activity/${id}/submit`, { answers })).data,
};
export function learningError(error: unknown): string {
  const message = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;
  return Array.isArray(message)
    ? message.join(" ")
    : message || "Não foi possível concluir. Tente novamente.";
}
