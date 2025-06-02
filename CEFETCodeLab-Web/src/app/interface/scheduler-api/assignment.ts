import { AssignmentAttempt } from "./assignment-attempt";
import { Class } from "./class";
import { Template } from "./template";

export interface Assignment {
  id: number;
  classId: number;
  title: string;
  description: string;
  validationScript: string;
  maxAttempts: number;
  workerType: string;
  assignmentAttempts: AssignmentAttempt[];
  class: Class;
  assignmentTemplates: Template[];
}

export interface CreateAssignmentRequest {
  classId: number;
  title: string;
  description: string;
  validationScript: string;
  templates: {
    templateId: number;
    params: {
      templateParamId: number;
      value: string;
    }[];
  }[];
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
