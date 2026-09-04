"use client";

import dynamic from "next/dynamic";

import { resolveMonacoLanguage } from "@/lib/monaco/language";
import {
  EEVEE_MONACO_THEME,
  registerEeveeMonacoTheme,
} from "@/lib/monaco/theme";
import { workspaceModelPath } from "@/lib/monaco/workspace/models";

import type { MonacoCodeEditorProps } from "./monaco-code-editor.types";
import { resolveMonacoEditorOptions } from "./monaco-editor-presets";
import { useMonacoEditorLifecycle } from "./use-monaco-editor-lifecycle";

export type {
  MonacoCodeEditorProps,
  MonacoEditorOptionOverrides,
  MonacoEditorPreset,
} from "./monaco-code-editor.types";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export function MonacoCodeEditor({
  preset,
  value,
  onChange,
  height = "100%",
  className,
  path,
  language,
  workerType,
  workspaceTree,
  actionGuardMode = "enforced",
  actionGuardScope,
  readOnly = false,
  optionOverrides,
}: MonacoCodeEditorProps) {
  const effectivePath =
    preset === "workspace" && path ? workspaceModelPath(path) : path;
  const effectiveLanguage = resolveMonacoLanguage({
    language,
    path,
    workerType,
  });
  const options = resolveMonacoEditorOptions(
    preset,
    optionOverrides,
    readOnly,
  );
  const handleMount = useMonacoEditorLifecycle({
    preset,
    path,
    workerType,
    workspaceTree,
    actionGuardMode,
    actionGuardScope,
  });

  return (
    <Editor
      height={height}
      theme={EEVEE_MONACO_THEME}
      path={effectivePath}
      value={value}
      language={effectiveLanguage}
      saveViewState={false}
      keepCurrentModel={false}
      onChange={(nextValue) => onChange?.(nextValue ?? "")}
      onMount={handleMount}
      beforeMount={registerEeveeMonacoTheme}
      className={className}
      options={options}
    />
  );
}
