import type { UserRole } from "@/app/interface/platform-api/user";
export interface AdminAttemptDetail {
  id: number;
  userId: number;
  assignmentId: number;
  attempt: number;
  isAcceptable: boolean;
  score: number;
  passes: number;
  fails: number;
  report: string;
  status: string;
  receivedWork?: Record<string, string>;
  hasSubmittedWork: boolean;
  createdAt: string;
}

export interface AdminAttempt extends AdminAttemptDetail {
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
  assignment: {
    id: number;
    title: string;
    description: string;
    workerType: string;
  };
}

export interface AdminSubmittedWork {
  attemptId: number;
  assignmentId: number;
  userId: number;
  attempt: number;
  createdAt: string;
  user: Pick<AdminAttempt["user"], "id" | "name" | "email">;
  assignment: AdminAttempt["assignment"];
  files: Record<string, string>;
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

export type AdminAttemptListItem = Omit<AdminAttempt, "report" | "receivedWork">;

export interface AdminAttemptsListResponse {
  data: AdminUserAttemptSummary[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface AdminUserAttemptsResponse {
  data: AdminAttemptDetail[];
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
