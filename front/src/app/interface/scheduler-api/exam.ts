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

export interface ExamWithActivities {
  exam: Exam;
  activities: AssignmentSummary[];
}

export interface ExamActivity {
  id: number;
  examId: number;
  activityId: number;
  exam?: Exam;
  activity?: AssignmentSummary;
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
