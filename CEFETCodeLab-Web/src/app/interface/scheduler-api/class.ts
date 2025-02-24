import { UserClass } from "./user-class";

export interface Class {
  id: number;
  name: string;
  userClasses: UserClass[];
}
