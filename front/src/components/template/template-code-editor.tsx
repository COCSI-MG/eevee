"use client";

import dynamic from "next/dynamic";
import {
  EEVEE_MONACO_THEME,
  registerEeveeMonacoTheme,
} from "@/lib/monaco/theme";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface TemplateCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  className?: string;
}

export default function TemplateCodeEditor({
  value,
  onChange,
  height = "600px",
  className,
}: TemplateCodeEditorProps) {
  return (
    <Editor
      height={height}
      defaultLanguage="typescript"
      value={value}
      theme={EEVEE_MONACO_THEME}
      onChange={(next) => onChange(next || "")}
      className={className}
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        wrappingIndent: "indent",
        fontSize: 14,
        lineNumbers: "on",
        quickSuggestions: false,
        suggest: {
          showWords: false,
          showSnippets: false,
        },
        "semanticHighlighting.enabled": false,
      }}
      beforeMount={(monaco) => {
        registerEeveeMonacoTheme(monaco);
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: true,
          noSuggestionDiagnostics: true,
        });
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: true,
          noSuggestionDiagnostics: true,
        });
      }}
    />
  );
}
