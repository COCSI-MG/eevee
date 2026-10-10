import { UserClass } from "./user-class";

export const UserRole = {
  STUDENT: "aluno",
  TEACHER: "professor",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
   id: number;
   name: string;
   email: string;
   role: UserRole;
   userClasses: UserClass[];
}

interface UserInput {
   name: string;
   email: string;
   role: UserRole;
}

export interface CreateUserRequest extends UserInput {
   password: string;
}

export interface UpdateUserRequest extends Partial<UserInput> {
   password?: string;
}
