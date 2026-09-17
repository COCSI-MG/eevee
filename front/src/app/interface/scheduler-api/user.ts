import { UserClass } from "./user-class";

export interface User {
   id: number;
   name: string;
   email: string;
   isAdmin: boolean;
   userClasses: UserClass[];
}

interface UserInput {
   name: string;
   email: string;
   isAdmin: boolean;
}

export interface CreateUserRequest extends UserInput {
   password: string;
}

export interface UpdateUserRequest extends Partial<UserInput> {
   password?: string;
}
