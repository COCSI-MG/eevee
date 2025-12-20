import { Class } from "./class";
import { User } from "./user";

export interface UserClass {
  id: number;
  userId: number;
  classId: number;
  user: User;
  class: Class
}
