import { AnswerKey } from "@/app/interface/scheduler-api/assignment";
import { FileNode } from "@/types/shared";
import { axiosClientWithAuth } from "./client";

export class AnswerKeyService {
  static async GetAnswerKey(assignmentId: number) {
    const response = await axiosClientWithAuth.get(
      `/assignment/${assignmentId}/answer-key`,
    );
    return <AnswerKey>response.data;
  }

  static async CreateAnswerKey(assignmentId: number, content: FileNode) {
    const response = await axiosClientWithAuth.post(
      `/assignment/${assignmentId}/answer-key`,
      { content },
    );
    return <AnswerKey>response.data;
  }

  static async UpdateAnswerKey(assignmentId: number, content: FileNode) {
    const response = await axiosClientWithAuth.put(
      `/assignment/${assignmentId}/answer-key`,
      { content },
    );
    return <AnswerKey>response.data;
  }

  static async DeleteAnswerKey(assignmentId: number) {
    await axiosClientWithAuth.delete(
      `/assignment/${assignmentId}/answer-key`,
    );
  }
}
