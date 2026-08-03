import { AssignmentAttempt } from "./assignment-attempt";

export interface Exam {
  id: number;
  title: string;
  description?: string;
  classId?: number;
  dueDate?: string;
  startDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  score: number;
}

export interface ExamWithAssignments {
  exam: Exam;
  assignments: AssignmentSummary[];
}

export interface ExamAssignment {
  id: number;
  examId: number;
  assignmentId: number;
  score: number;
  exam?: Exam;
  assignment?: AssignmentSummary;
}

export interface CreateExamRequest {
  title: string;
  description?: string;
  classId: number;
  dueDate?: string;
  startDate?: string | null;
}

export type UpdateExamRequest = Partial<
  Pick<CreateExamRequest, "title" | "description" | "dueDate" | "startDate">
>;

export enum ExamDialogMode {
  Closed = "closed",
  Create = "create",
  Edit = "edit",
}
