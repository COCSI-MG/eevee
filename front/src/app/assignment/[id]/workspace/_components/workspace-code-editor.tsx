"use client";

import dynamic from "next/dynamic";
import { OnMount } from "@monaco-editor/react";
import React from "react";
import { editor, IDisposable } from "monaco-editor";
import { useWorkspaceContext } from "../_providers/workspace-provider";
import { FileNode } from "@/types/shared";
import { applyLanguageDefaults } from "@/lib/monaco/worker-intellisense";
import {
  disposeWorkspaceModels,
  syncWorkspaceModels,
  workspaceModelPath,
} from "@/lib/monaco/workspace-models";
import { applyTypePack, clearTypePacks } from "@/lib/monaco/type-pack-loader";

type MonacoNamespace = typeof import("monaco-editor");

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const BLOCKED_EDITOR_DRAG_EVENTS = [
  "dragstart",
  "dragenter",
  "dragover",
  "drop",
] as const;

function blockEditorDragAction(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "none";
  }

  return false;
}

function getMonacoLanguage(language: string | undefined): string {
  const normalized = (language || "").trim().toLowerCase();

  if (normalized === "ts" || normalized === "tsx") return "typescript";
  if (normalized === "js" || normalized === "jsx") return "javascript";
  if (normalized === "yml") return "yaml";
  if (normalized === "py") return "python";

  return normalized || "typescript";
}

interface WorkspaceCodeEditorProps {
  onEditorChange: (value: string | undefined) => void;
  file: {
    name: string;
    path: string;
    language: string;
    value: string;
  } | null;
}

export default function WorkspaceCodeEditor({
  file,
  onEditorChange,
}: WorkspaceCodeEditorProps) {
  const { fileTreeData, workerType } = useWorkspaceContext();
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = React.useRef<MonacoNamespace | null>(null);
  const treeRef = React.useRef<FileNode | null>(null);
  const currentFilePathRef = React.useRef("");
  const importCompletionDisposableRef = React.useRef<IDisposable[]>([]);
  const contextMenuDisposableRef = React.useRef<IDisposable | null>(null);
  const editorDragGuardCleanupRef = React.useRef<(() => void) | null>(null);
  const importCompletionRegisteredRef = React.useRef(false);
  const monacoLanguage = getMonacoLanguage(file?.language);

  React.useEffect(() => {
    treeRef.current = fileTreeData;
  }, [fileTreeData]);

  React.useEffect(() => {
    currentFilePathRef.current = file?.path || "";
  }, [file?.path]);

  React.useEffect(() => {
    if (!monacoRef.current) return;
    syncWorkspaceModels(
      monacoRef.current,
      fileTreeData,
      currentFilePathRef.current,
    );
  }, [fileTreeData, file?.path]);

  React.useEffect(() => {
    if (!monacoRef.current) return;
    applyLanguageDefaults(monacoRef.current, workerType);
    void applyTypePack(monacoRef.current, workerType);
  }, [workerType]);

  React.useEffect(() => {
    return () => {
      importCompletionDisposableRef.current.forEach((disposable) =>
        disposable.dispose(),
      );
      importCompletionDisposableRef.current = [];
      contextMenuDisposableRef.current?.dispose();
      contextMenuDisposableRef.current = null;
      editorDragGuardCleanupRef.current?.();
      editorDragGuardCleanupRef.current = null;
      importCompletionRegisteredRef.current = false;

      if (monacoRef.current) {
        disposeWorkspaceModels(monacoRef.current);
        clearTypePacks(monacoRef.current);
        monacoRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === "hidden") return;

      window.requestAnimationFrame(() => {
        editorRef.current?.layout();
      });
    };

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);

    return () => {
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
    };
  }, []);

  const normalizePath = React.useCallback((path: string) => {
    return path.split("/").filter(Boolean).join("/");
  }, []);

  const collectFilePaths = React.useCallback(
    (node: FileNode | null): string[] => {
      if (!node) return [];

      if (node.isFile) {
        return [node.path];
      }

      if (!node.children?.length) {
        return [];
      }

      return node.children.flatMap((child) => collectFilePaths(child));
    },
    [],
  );

  const toImportPath = React.useCallback(
    (fromFilePath: string, targetFilePath: string) => {
      const fromDirParts = normalizePath(fromFilePath).split("/").slice(0, -1);
      const targetParts = normalizePath(targetFilePath).split("/");

      let commonPrefixLength = 0;
      while (
        commonPrefixLength < fromDirParts.length &&
        commonPrefixLength < targetParts.length &&
        fromDirParts[commonPrefixLength] === targetParts[commonPrefixLength]
      ) {
        commonPrefixLength++;
      }

      const upSegments = new Array(
        fromDirParts.length - commonPrefixLength,
      ).fill("..");
      const downSegments = targetParts.slice(commonPrefixLength);
      const relativeSegments = [...upSegments, ...downSegments];

      let relativePath = relativeSegments.join("/");
      if (!relativePath.startsWith(".")) {
        relativePath = `./${relativePath}`;
      }

      return relativePath
        .replace(/\.(tsx|ts|jsx|js)$/, "")
        .replace(/\/index$/, "");
    },
    [normalizePath],
  );

  const buildImportSuggestions = React.useCallback(
    (currentPath: string, typedValue: string) => {
      const tree = treeRef.current;
      if (!tree || !currentPath) return [];

      const allFiles = collectFilePaths(tree);
      const rawSuggestions = allFiles
        .filter((path) => path !== currentPath)
        .map((path) => toImportPath(currentPath, path));

      const uniqueSuggestions = Array.from(new Set(rawSuggestions));
      const typed = typedValue.trim();

      return uniqueSuggestions
        .filter((candidate) =>
          typed.length > 0
            ? candidate.startsWith(typed)
            : candidate.startsWith("."),
        )
        .sort((a, b) => a.localeCompare(b));
    },
    [collectFilePaths, toImportPath],
  );

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editorDragGuardCleanupRef.current?.();

    const editorDomNode = editor.getDomNode();
    if (editorDomNode) {
      BLOCKED_EDITOR_DRAG_EVENTS.forEach((eventName) => {
        editorDomNode.addEventListener(eventName, blockEditorDragAction, true);
      });

      editorDragGuardCleanupRef.current = () => {
        BLOCKED_EDITOR_DRAG_EVENTS.forEach((eventName) => {
          editorDomNode.removeEventListener(
            eventName,
            blockEditorDragAction,
            true,
          );
        });
      };
    }

    // Configurar IntelliSense derivada do worker: opcoes de compilacao,
    // modelos de todos os arquivos do workspace e type packs offline.
    monacoRef.current = monaco;
    applyLanguageDefaults(monaco, workerType);
    syncWorkspaceModels(monaco, treeRef.current, currentFilePathRef.current);
    void applyTypePack(monaco, workerType);

    // Configurar editor
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      tabSize: 2,
      lineHeight: 1.6,
      scrollBeyondLastLine: false,
      wordWrap: "on",
      parameterHints: {
        enabled: true,
      },
      suggest: {
        snippetsPreventQuickSuggestions: false,
        showIcons: true,
      },
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      dragAndDrop: false,
      dropIntoEditor: { enabled: false },
      contextmenu: false,
      selectionHighlight: true,
    });

    contextMenuDisposableRef.current?.dispose();
    contextMenuDisposableRef.current = editor.onContextMenu((event) => {
      event.event.preventDefault();
      event.event.stopPropagation();
    });

    const importLinePattern =
      /(import\s+.*?from\s+|export\s+.*?from\s+|import\s*)['"]([^'"\n]*)$/;

    const provideImportCompletionItems: Parameters<
      typeof monaco.languages.registerCompletionItemProvider
    >[1]["provideCompletionItems"] = (model, position) => {
      const lineContent = model.getLineContent(position.lineNumber);
      const lineUntilCursor = lineContent.slice(0, position.column - 1);
      const match = lineUntilCursor.match(importLinePattern);

      if (!match) {
        return { suggestions: [] };
      }

      const typedImportValue = match[2] || "";
      const suggestions = buildImportSuggestions(
        currentFilePathRef.current || model.uri.path.replace(/^\//, ""),
        typedImportValue,
      );

      const startColumn = position.column - typedImportValue.length;
      const range = new monaco.Range(
        position.lineNumber,
        startColumn,
        position.lineNumber,
        position.column,
      );

      return {
        suggestions: suggestions.map((suggestion) => ({
          label: suggestion,
          kind: monaco.languages.CompletionItemKind.File,
          insertText: suggestion,
          range,
        })),
      };
    };

    if (!importCompletionRegisteredRef.current) {
      importCompletionDisposableRef.current = [
        monaco.languages.registerCompletionItemProvider("typescript", {
          triggerCharacters: ["'", '"', "/", "."],
          provideCompletionItems: provideImportCompletionItems,
        }),
        monaco.languages.registerCompletionItemProvider("javascript", {
          triggerCharacters: ["'", '"', "/", "."],
          provideCompletionItems: provideImportCompletionItems,
        }),
      ];

      importCompletionRegisteredRef.current = true;
    }
  };

  if (file === null || file.name.trim() === "") {
    return (
      <div className="flex items-center justify-center h-full min-h-0 text-gray-500">
        Selecione um arquivo para começar a editar.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="bg-editor-header border-b border-border">
        <div className="flex">
          <div className="flex items-center px-4 py-2 bg-editor-bg border-r border-border">
            <span className="text-sm">{file.name}</span>
            <span className="ml-2 text-xs text-gray-500">
              ({file.language || "typescript"})
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          path={workspaceModelPath(file.path)}
          value={file.value}
          language={monacoLanguage}
          saveViewState={false}
          keepCurrentModel={false}
          onChange={onEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly: false,
            automaticLayout: true,
            dragAndDrop: false,
            dropIntoEditor: { enabled: false },
            contextmenu: false,
          }}
        />
      </div>
    </div>
  );
}
