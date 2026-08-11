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

export type AssignmentInterviewQuestionType = 'likert_1_5' | 'short_text';

export interface AssignmentInterviewQuestion {
  key: string;
  label: string;
  type: AssignmentInterviewQuestionType;
}

export interface AssignmentInterviewConfig {
  questions: AssignmentInterviewQuestion[];
}

export interface AnswerKey {
  id: number;
  assignmentId: number;
  content: FileNode;
  createdAt: string;
  updatedAt: string;
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
  interviewConfig?: AssignmentInterviewConfig;
  answerKeyId?: number | null;
  answerKeyVisible: boolean;
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
  answerKeyVisible?: boolean;
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
  answerKeyVisible?: boolean;
}
