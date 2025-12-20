import { FileNode } from "@/types/shared";
import { AssignmentAttempt } from "./assignment-attempt";
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

export interface Assignment {
  id: number;
  classId: number;
  title: string;
  description: string;
  validationScript: string;
  maxAttempts: number;
  workerType: string;
  workerDefinition: WorkerDefinition;
  assignmentAttempts: AssignmentAttempt[];
  class: Class;
  assignmentTemplates: Template[];
  suspensions?: AssignmentUserSuspension[];
}

export interface CreateAssignmentRequest {
  classId: number;
  title: string;
  description: string;
  validationScript: string;
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
  validationScript: string;
  template: string;
  maxAttempts: number;
  workerType: string;
}
