import { UserRole } from "./interface/scheduler-api/user";

export enum Route {
  Assignment = "assignment",
  Login = "login",
  ForgotPassword = "forgot-password",
  ResetPassword = "reset-password",
  Workspace = "workspace",
  AnswerKey = "answer-key",
  Admin = "admin",
  AdminAssignments = "/admin/assignments",
  AdminUsers = "admin/users",
  AdminClasses = "admin/classes",
  AdminClassExams = "exams",
  AdminAssignmentCreate = "admin/assignments/create",
  AdminTemplate = "/admin/templates",
  AdminAttempts = "/admin/attempts",
  AssignmentAlerts = "suspensions",
  Classes = "classes",
}

const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, string> = {
  [UserRole.ADMIN]: `/${Route.Admin}`,
  [UserRole.TEACHER]: `/${Route.AdminClasses}`,
  [UserRole.STUDENT]: `/${Route.Classes}`
};

export const getDefaultRouteForRole = (role: UserRole): string => DEFAULT_ROUTE_BY_ROLE[role];
