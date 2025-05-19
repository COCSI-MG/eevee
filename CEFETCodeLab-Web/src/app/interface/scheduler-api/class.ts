import { UserClass } from "./user-class";

export interface Class {
  id: number;
  name: string;
  description: string;
  userClasses: UserClass[];
}

export interface UpsertClass {
  id?: number;
  name: string;
  description?: string;
  students: number[];
}