import { AssignmentAttempt } from "./assignment-attempt";
import { Class } from "./class";

export interface Assignment {
  id: number;
  classId: number;
  title: string;
  description: string;
  validationScript: string;
  template: string;
  maxAttempts: number;
  workerType: string;
  assignmentAttempts: AssignmentAttempt[];
  class: Class;
}

export interface CreateAssignmentRequest {
  classId: number;
  title: string;
  description: string;
  validationScript: string;
  template: string;
  maxAttempts: number;
  workerType: string;
}

export interface UpdateAssignmentRequest {
  id: number;
  classId: number;
  title: string;
  description: string;
  validationScript: string;
  template: string;
  maxAttempts: number;
  workerType: string;
}
