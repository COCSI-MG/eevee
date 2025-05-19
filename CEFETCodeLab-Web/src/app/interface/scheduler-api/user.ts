import { UserClass } from "./user-class";

export interface User {
   id: number;
   name: string;
   email: string;
   passwordHash: string;
   isAdmin: boolean; 
   userClasses: UserClass[];
}

export interface UpsertUser {
   id?: number;
   name: string;
   email: string;
   passwordHash: string;
   isAdmin: boolean;
}