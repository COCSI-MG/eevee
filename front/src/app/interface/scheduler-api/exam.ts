export interface Exam {
  id: number;
  title: string;
  description?: string;
  classId?: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

import { AssignmentAttempt } from "./assignment-attempt";

export interface AssignmentUserSuspensionSummary {
  id: number;
  reason: string | null;
  createdAt: string;
}

export interface AssignmentSummary {
  id: number;
  title: string;
  description?: string;
  classId: number;
  maxAttempts: number;
  workerType: string;
  lastAttempt: AssignmentAttempt | null;
  suspensions: AssignmentUserSuspensionSummary[];
}

export interface ExamWithAssignments {
  exam: Exam;
  assignments: AssignmentSummary[];
}

export interface ExamAssignment {
  id: number;
  examId: number;
  assignmentId: number;
  exam?: Exam;
  assignment?: AssignmentSummary;
}

export interface CreateExamRequest {
  title: string;
  description?: string;
  classId: number;
  dueDate?: string;
}

export type UpdateExamRequest = Partial<
  Pick<CreateExamRequest, "title" | "description" | "dueDate">
>;
