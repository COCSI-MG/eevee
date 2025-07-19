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
}

export interface UpsertClass {
  id?: number;
  name: string;
  description?: string;
  students: number[];
}