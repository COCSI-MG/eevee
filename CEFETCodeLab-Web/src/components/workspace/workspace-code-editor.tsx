"use client";

import dynamic from "next/dynamic";
import { OnMount } from "@monaco-editor/react";
import React from "react";
import { editor } from "monaco-editor";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface WorkspaceCodeEditorProps {
  onEditorChange: (value: string | undefined) => void;
  file: {
    name: string;
    language: string;
    value: string;
  } | null;
}

export default function WorkspaceCodeEditor({
  file,
  onEditorChange,
}: WorkspaceCodeEditorProps) {
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configurar TypeScript para suportar JSX/TSX
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
    });

    // Habilitar validação
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Mesmo para JavaScript
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

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
      contextmenu: true,
      selectionHighlight: true,
    });
  };

  if (file === null || file.name.trim() === "") {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Selecione um arquivo para começar a editar.
      </div>
    );
  }

  return (
    <>
      <div className="bg-editor-header border-b border-border">
        <div className="flex">
          <div className="flex items-center px-4 py-2 bg-editor-bg border-r border-border">
            <span className="text-sm">{file.name}</span>
            <span className="ml-2 text-xs text-gray-500">(typescript)</span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          path={file.name}
          value={file.value}
          language="typescript"
          onChange={onEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly: false,
          }}
        />
      </div>
    </>
  );
}
