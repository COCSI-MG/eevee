import { AssignmentUserSuspension } from "./assignment-user-suspension";
import { UserClass } from "./user-class";

export interface User {
   id: number;
   name: string;
   email: string;
   passwordHash: string;
   isAdmin: boolean;
   userClasses: UserClass[];
   assignmentSuspensions?: AssignmentUserSuspension[];
}

export interface UpsertUser {
   id?: number;
   name: string;
   email: string;
   passwordHash: string;
   isAdmin: boolean;
}