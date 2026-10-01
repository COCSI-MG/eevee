import { Assignment } from "./assignment";
import { UserClass } from "./user-class";

export enum ClassStatusFilter {
  Active = "active",
  Inactive = "inactive"
}

export interface Class {
  id: number;
  name: string;
  description: string;
  teacherId?: number | null;
  deletedAt?: string | null;
  userClasses: UserClass[];
  users: {
    userId: number;
  }[];
  assignments?: Assignment[];
  activityCounts?: { exams: number; practices: number; quizzes: number };
}

export type ClassOption = Pick<Class, "id" | "name">;

export interface UpsertClass {
  id?: number;
  name: string;
  description?: string;
  students: number[];
  teacherId?: number | null;
}
