import { Assignment } from "./assignment";
import { UserClass } from "./user-class";

export interface Class {
  id: number;
  name: string;
  description: string;
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
}
