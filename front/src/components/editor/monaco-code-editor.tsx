"use client";

import dynamic from "next/dynamic";
import { loader } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";

import {
  EDITOR_ACTION_GUARD_MODE,
  type EditorActionGuardMode,
} from "@/constants/editor-action-guard";
import { registerEditorActionGuard } from "@/hooks/user-actions/editor-action-guard";
import { findWorkerEditorConfig } from "@/lib/monaco/worker-editor-config";
import { resolveMonacoLanguage } from "@/lib/monaco/language";
import {
  EEVEE_MONACO_THEME,
  registerEeveeMonacoTheme,
} from "@/lib/monaco/theme";
import { configureJsxWorker } from "@/lib/monaco/workspace/jsx-editing";
import { workspaceModelPath } from "@/lib/monaco/workspace/models";

import type { MonacoCodeEditorProps } from "./monaco-code-editor.types";
import { resolveMonacoEditorOptions } from "./monaco-editor-presets";
import { useMonacoEditorLifecycle } from "./use-monaco-editor-lifecycle";

import type { BeforeMount } from "@monaco-editor/react";

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
  onDidType,
  height = "100%",
  className,
  path,
  language,
  workerType,
  workspaceTree,
  actionGuardMode = EDITOR_ACTION_GUARD_MODE.ENFORCED,
  actionGuardScope,
  readOnly = false,
  optionOverrides,
}: MonacoCodeEditorProps) {
  const effectivePath = (preset === "workspace" && path) ? workspaceModelPath(path) : path;
  const effectiveLanguage = resolveMonacoLanguage({
    language,
    path,
    workerType,
  });
  const isWebEditing = preset === "workspace" && !!findWorkerEditorConfig(workerType)?.webEditing;

  const options = resolveMonacoEditorOptions(
    preset,
    optionOverrides,
    readOnly,
    isWebEditing,
  );
  const handleMount = useMonacoEditorLifecycle({
    preset,
    path,
    workerType,
    workspaceTree,
    actionGuardMode,
    actionGuardScope,
    onDidType,
  });

  const handleBeforeMount: BeforeMount = (monaco) => {
    registerEeveeMonacoTheme(monaco);

    if (isWebEditing) {
      configureJsxWorker(monaco);
    }
  }

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
      beforeMount={handleBeforeMount}
      className={className}
      options={options}
    />
  );
}

interface MonacoCodeDiffProps {
  original: string;
  modified: string;
  path: string;
  height: string;
  originalLabel: string;
  modifiedLabel: string;
  actionGuardMode: EditorActionGuardMode;
}

export function MonacoCodeDiff({
  original,
  modified,
  path,
  height,
  originalLabel,
  modifiedLabel,
  actionGuardMode,
}: MonacoCodeDiffProps) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const host = container.current;
    if (!host) return;

    let active = true;
    let disposeDiff: (() => void) | undefined;
    const loading = loader.init();
    void loading.then((monaco) => {
      if (!active) return;

      registerEeveeMonacoTheme(monaco);
      const language = resolveMonacoLanguage({ path });
      const diff = monaco.editor.createDiffEditor(host, {
        automaticLayout: true,
        theme: EEVEE_MONACO_THEME,
        readOnly: true,
        renderSideBySide: false,
        renderMarginRevertIcon: false,
        ignoreTrimWhitespace: false,
        contextmenu: false,
        dragAndDrop: false,
        minimap: { enabled: false },
        originalAriaLabel: originalLabel,
        modifiedAriaLabel: modifiedLabel,
      });
      const originalModel = monaco.editor.createModel(original, language);
      const modifiedModel = monaco.editor.createModel(modified, language);
      diff.setModel({ original: originalModel, modified: modifiedModel });
      const unregisterGuards = [
        diff.getOriginalEditor(),
        diff.getModifiedEditor(),
      ].map((editor) => registerEditorActionGuard(editor, actionGuardMode));

      disposeDiff = () => {
        unregisterGuards.forEach((unregister) => unregister());
        diff.setModel(null);
        diff.dispose();
        // Monaco releases the detached diff view and cancels its work on the next task.
        setTimeout(() => {
          originalModel.dispose();
          modifiedModel.dispose();
        }, 0);
      };
      setStatus("ready");
    }).catch(() => {
      if (active) setStatus("error");
    });

    return () => {
      active = false;
      loading.cancel();
      disposeDiff?.();
    };
  }, [
    original,
    modified,
    path,
    originalLabel,
    modifiedLabel,
    actionGuardMode,
  ]);

  return (
    <div className="relative" style={{ height }}>
      <div ref={container} className="h-full" />
      {status !== "ready" && (
        <p role="status" className="absolute inset-x-0 top-0 p-3 text-sm">
          {status === "error"
            ? "Não foi possível carregar a comparação."
            : "Carregando comparação…"}
        </p>
      )}
    </div>
  );
}
