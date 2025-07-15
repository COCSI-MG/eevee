"use client";

import dynamic from "next/dynamic";
import { OnMount } from "@monaco-editor/react";
import React from "react";
import { DEFAULT_ASSIGNMENT_TEMPLATE } from "@/app/admin/assignments/constants";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface WorkspaceCodeEditorProps {
  activeFile: string;
  onEditorChange: (value: string | undefined) => void;
  editorValue?: string;
  editorDefaultValue?: string;
}

export default function WorkspaceCodeEditor({
  activeFile,
  onEditorChange,
  editorValue,
  editorDefaultValue = DEFAULT_ASSIGNMENT_TEMPLATE
}: WorkspaceCodeEditorProps) {
  const editorRef = React.useRef<unknown>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      tabSize: 2,
      lineHeight: 1.6,
      scrollBeyondLastLine: false,
      wordWrap: "on",
      parameterHints: {
        enabled: false,
      },
      suggest: {
        snippetsPreventQuickSuggestions: true,
        showIcons: true,
      },
      inlayHints: {
        enabled: "off",
      },
      quickSuggestions: false,
    });
  };

  return (
    <>
      <div className="bg-editor-header border-b border-border">
        <div className="flex">
          <div className="flex items-center px-4 py-2 bg-editor-bg border-r border-border">
            <span className="text-sm">{activeFile}</span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="vs-dark"
          onMount={handleEditorDidMount}
          defaultValue={editorDefaultValue}
          value={editorValue}
          onChange={(value) => onEditorChange(value)}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            tabSize: 2,
            lineHeight: 1.6,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            parameterHints: {
              enabled: false,
            },
            suggest: {
              snippetsPreventQuickSuggestions: true,
              showIcons: true,
            },
            inlayHints: {
              enabled: "off",
            },
            quickSuggestions: false,
          }}
        />
      </div>
    </>
  );
}
