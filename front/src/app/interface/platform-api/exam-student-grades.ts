export interface ExamStudentLastAttempt {
  id: number;
  status: string;
  score: number;
  isAcceptable: boolean;
  passes: number;
  fails: number;
  createdAt: string;
}

export interface ExamStudentAssignment {
  assignmentId: number;
  title: string;
  weight: number;
  isAcceptable: boolean;
  score: number;
  passes: number;
  fails: number;
  attemptsCount: number;
  lastAttempt: ExamStudentLastAttempt | null;
}

export interface ExamStudentGrades {
  userId: number;
  name: string;
  email: string;
  totalAssignments: number;
  attemptedAssignments: number;
  approvedAssignments: number;
  examGrade: number;
  maxExamGrade: number;
  assignments: ExamStudentAssignment[];
}
