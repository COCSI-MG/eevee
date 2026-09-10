import type { editor } from "monaco-editor";

import type { WorkerType } from "@/app/interface/scheduler-api/worker";
import type { EditorActionGuardMode } from "@/constants/editor-action-guard";
import type { FileNode } from "@/types/shared";

/**
 * Monaco options that callers may override after the selected preset is
 * applied. Every property keeps the original Monaco type and documentation.
 */
export type MonacoEditorOptionOverrides = Pick<
  editor.IStandaloneEditorConstructionOptions,
  | "fontSize"
  | "lineHeight"
  | "wordWrap"
  | "wrappingIndent"
  | "lineNumbers"
  | "hover"
  | "links"
  | "semanticHighlighting.enabled"
>;

interface BaseMonacoCodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  height?: string | number;
  className?: string;
  path?: string;
  language?: string;
  workerType?: WorkerType | string;
  readOnly?: boolean;
  optionOverrides?: MonacoEditorOptionOverrides;
}

/** General-purpose editable field with the standard Monaco experience. */
interface MonacoFormFieldEditorProps extends BaseMonacoCodeEditorProps {
  preset: "form-field";
  workspaceTree?: never;
  actionGuardMode?: never;
  actionGuardScope?: never;
}

/**
 * Template authoring editor with quick suggestions, semantic highlighting and
 * validation decorations reduced to keep placeholders easier to edit.
 */
interface MonacoTemplateAuthoringEditorProps
  extends BaseMonacoCodeEditorProps {
  preset: "template-authoring";
  workspaceTree?: never;
  actionGuardMode?: never;
  actionGuardScope?: never;
}

/** Compact editor intended for short template parameter values. */
interface MonacoParameterInputEditorProps extends BaseMonacoCodeEditorProps {
  preset: "parameter-input";
  workspaceTree?: never;
  actionGuardMode?: never;
  actionGuardScope?: never;
}

/**
 * Read-only code preview. Mutating props are forbidden because this preset
 * always controls the read-only behavior.
 */
interface MonacoReadOnlyPreviewEditorProps extends BaseMonacoCodeEditorProps {
  preset: "read-only-preview";
  workspaceTree?: never;
  onChange?: never;
  readOnly?: never;
  actionGuardMode?: never;
  actionGuardScope?: never;
}

/**
 * Full assignment workspace with cross-file models, IntelliSense, type packs
 * and optional integration with the global user-action guards.
 */
interface MonacoWorkspaceEditorProps extends BaseMonacoCodeEditorProps {
  preset: "workspace";
  path: string;
  workspaceTree: FileNode;
  actionGuardMode?: EditorActionGuardMode;
  actionGuardScope?: string;
}

export type MonacoCodeEditorProps =
  | MonacoFormFieldEditorProps
  | MonacoTemplateAuthoringEditorProps
  | MonacoParameterInputEditorProps
  | MonacoReadOnlyPreviewEditorProps
  | MonacoWorkspaceEditorProps;

export type MonacoEditorPreset = MonacoCodeEditorProps["preset"];
