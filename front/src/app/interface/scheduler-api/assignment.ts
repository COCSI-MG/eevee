import { FileNode } from "@/types/shared";
import { AssignmentAttempt } from "./assignment-attempt";
import { AssignmentParam } from "./assignment-param";
import { AssignmentUserSuspension } from "./assignment-user-suspension";
import { Class } from "./class";
import { Template } from "./template";

export interface AssignmentTemplateParam {
  templateParamId: number;
  value: string;
}

export interface WorkerDefinition {
  files: Pick<FileNode , 'id' | 'children' | 'content'> & { type: 'file' | 'folder' }[] | null;
  startCommands: string[];
  testCommands: string[];
  dependencies: string[];
}

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
  /** Source-of-truth starter code returned by backend. */
  boilerplateContent?: string;
  /** Preferred name for the teacher-provided starter code shown in the student workspace. */
  boilerplate?: string;
  /** Backward-compatible alias (legacy name used by older frontend code). */
  validationScript?: string;
  /** SQL script to initialize the database for PostgreSQL-backed workers. */
  initSqlScript?: string;
  maxAttempts: number;
  workerType: string;
  workerDefinition: WorkerDefinition;
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
  boilerplateContent?: string;
  boilerplate?: string;
  validationScript?: string;
  initSqlScript?: string;
  templates: {
    templateId: number;
    params: AssignmentTemplateParam[];
  }[] | null;
  maxAttempts: number;
  workerType: string;
  workerDefinition: WorkerDefinition;
}

export interface UpdateAssignmentRequest {
  id: number;
  classId: number;
  title: string;
  description: string;
  boilerplateContent?: string;
  boilerplate?: string;
  validationScript?: string;
  initSqlScript?: string;
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
