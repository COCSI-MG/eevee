export interface AdminAttempt {
  id: number;
  attempt: number;
  userId: number;
  assignmentId: number;
  isAcceptable: boolean;
  score: number;
  passes: number;
  fails: number;
  report: string;
  status: string;
  receivedWork?: Record<string, string>;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    isAdmin: boolean;
  };
  assignment: {
    id: number;
    title: string;
    description: string;
    workerType: string;
  };
}

export type AdminAttemptListItem = Omit<AdminAttempt, "report" | "receivedWork">;

export interface AdminAttemptsListResponse {
  data: AdminAttemptListItem[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
