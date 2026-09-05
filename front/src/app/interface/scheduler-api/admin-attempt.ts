export interface AdminAttemptDetail {
  id: number;
  attempt: number;
  isAcceptable: boolean;
  score: number;
  passes: number;
  fails: number;
  report: string;
  status: string;
  receivedWork?: Record<string, string>;
  createdAt: string;
}

export interface AdminAttempt extends AdminAttemptDetail {
  userId: number;
  assignmentId: number;
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

export interface AdminUserAttemptSummary {
  user: {
    id: number;
    email: string;
  };
  assignment: {
    id: number;
    title: string;
  };
  attemptsCount: number;
  lastAttempt: Pick<
    AdminAttemptDetail,
    "id" | "attempt" | "status" | "score" | "createdAt"
  >;
}

export interface AdminAttemptsListResponse {
  data: AdminUserAttemptSummary[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface AdminAttemptClassOption {
  id: number;
  name: string;
}

export interface AdminAttemptAssignmentOption {
  id: number;
  title: string;
  classId: number;
}
