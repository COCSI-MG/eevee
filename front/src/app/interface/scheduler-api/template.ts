import { WorkerType } from "./worker";

export enum TemplateParamType {
  OBJECT = "OBJECT",
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
}

export interface TemplateParam {
  id: number;
  name: string;
  templateId: number;
  type?: TemplateParamType;
}

export interface Template {
  id: number;
  title: string;
  description: string;
  workerType: WorkerType;
  content: string;
  templateParams: TemplateParam[];
  dependencies: string[];
}

export interface CreateTemplateRequest {
  id?: number; // Optional for new templates
  title: string;
  description: string;
  workerType: WorkerType;
  content: string;
  params: string[];
  typedParams?: Array<{ name: string; type: TemplateParamType }>;
  dependencies?: string[];
}

export interface TestTemplateRequest {
  workerType: WorkerType;
  templateContent: string;
  applicationFileContent: string;
  files?: Record<string, string>;
  params?: Record<string, string>;
  paramDefs?: Array<{ name: string; type?: TemplateParamType }>;
  dependencies?: string[];
}

export interface TestTemplateResponse {
  passes: number;
  failures: number;
  completeTrace: string;
}
