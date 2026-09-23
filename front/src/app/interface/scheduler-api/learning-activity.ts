export interface PracticeTask {
  id: string;
  prompt: string;
  starter: string;
  checkSql?: string;
  expectedRows?: string;
  tool?: "base" | "storage";
  expectedValue?: string;
  inputBase?: number;
}
export interface PracticeConfig {
  lab: "sql" | "architecture";
  setupSql: string;
  tasks: PracticeTask[];
}
export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: { id: string; text: string }[];
  correctChoiceId?: string;
  explanation?: string;
}
export interface LearningActivity {
  id: number;
  classId: number;
  kind: "practice" | "quiz";
  title: string;
  description: string;
  published: boolean;
  startDate: string | null;
  dueDate: string | null;
  maxAttempts: number;
  feedbackReleased: boolean;
  practice: PracticeConfig | null;
  questions: QuizQuestion[] | null;
}
export interface QuizAttempt {
  id: number;
  userId: number;
  name?: string;
  attempt: number;
  createdAt: string;
  score: number | null;
  answers: { questionId: string; choiceId: string }[];
  feedback?: {
    questionId: string;
    correctChoiceId: string;
    explanation: string;
  }[];
}
