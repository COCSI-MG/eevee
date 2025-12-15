import { AssignmentAttempt } from "./assignment-attempt";
import { AssignmentParam } from "./assignment-param";
import { AssignmentUserSuspension } from "./assignment-user-suspension";
import { Class } from "./class";
import { Template } from "./template";

export interface AssignmentTemplate {
  id: number;
  assignmentId: number;
  templateId: number;
  template: Template;
}

export interface Assignment {
  id: number;
  classId: number;
  title: string;
  description: string;
  /** Preferred name for the teacher-provided starter code shown in the student workspace. */
  boilerplate?: string;
  /** Backward-compatible alias (legacy name used by older frontend code). */
  validationScript?: string;
  maxAttempts: number;
  workerType: string;
  assignmentAttempts: AssignmentAttempt[];
  class: Class;
  assignmentTemplates: AssignmentTemplate[];
  assignmentParams: AssignmentParam[];
  suspensions?: AssignmentUserSuspension[];
}

export interface CreateAssignmentRequest {
  classId: number;
  title: string;
  description: string;
  boilerplate?: string;
  validationScript?: string;
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
  boilerplate?: string;
  validationScript?: string;
  maxAttempts: number;
  workerType: string;
  templates: {
    templateId: number;
    params: {
      templateParamId: number;
      value: string;
    }[];
  }[];
}
