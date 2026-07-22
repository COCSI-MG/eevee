export interface Exam {
  id: number;
  title: string;
  description?: string;
  classId?: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSummary {
  id: number;
  title: string;
  description?: string;
  classId: number;
  maxAttempts: number;
  workerType: string;
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
