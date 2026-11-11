import { WorkerType } from "@/app/interface/platform-api/worker";
import type { FileNode } from "@/types/shared";
import type { editor } from "monaco-editor";

export type EditorFeatureId = "jsx-editing" | "python-intellisense";
export type Monaco = typeof import("monaco-editor");

export interface WorkspaceRuntimeConfig {
  tree: FileNode;
  activePath: string;
  workerType?: WorkerType | string;
}

export interface EditorFeatureContext {
  monaco: Monaco;
  editor: editor.IStandaloneCodeEditor;
  getConfig(): WorkspaceRuntimeConfig;
  getModels(): editor.ITextModel[];
}

export interface EditorFeatureRegistration {
  update(): void;
  dispose(): void;
}

export interface EditorFeature {
  options?: editor.IStandaloneEditorConstructionOptions;
  prepare?(monaco: Monaco): void;
  register(context: EditorFeatureContext): EditorFeatureRegistration;
}
