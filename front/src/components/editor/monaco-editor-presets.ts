import type { editor } from "monaco-editor";

import type {
  MonacoEditorOptionOverrides,
  MonacoEditorPreset,
} from "./monaco-code-editor.types";

const BASE_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
};

const EDITOR_PRESET_OPTIONS: Record<
  MonacoEditorPreset,
  editor.IStandaloneEditorConstructionOptions
> = {
  // General-purpose editor used by larger form fields.
  "form-field": {
    wordWrap: "on",
  },
  // Keeps template placeholders readable and avoids noisy diagnostics.
  "template-authoring": {
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
    renderValidationDecorations: "off",
  },
  // Small editor used for individual template parameter values.
  "parameter-input": {
    wordWrap: "on",
    fontSize: 12,
    lineHeight: 16,
  },
  // Display-only source preview.
  "read-only-preview": {
    readOnly: true,
    wordWrap: "off",
  },
  // Full IDE-like assignment workspace.
  workspace: {
    fontSize: 14,
    minimap: { enabled: false },
    tabSize: 2,
    lineHeight: 22,
    wordWrap: "on",
    parameterHints: { enabled: true },
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
  },
};

export function resolveMonacoEditorOptions(
  preset: MonacoEditorPreset,
  overrides: MonacoEditorOptionOverrides | undefined,
  readOnly: boolean,
): editor.IStandaloneEditorConstructionOptions {
  return {
    ...BASE_EDITOR_OPTIONS,
    ...EDITOR_PRESET_OPTIONS[preset],
    ...overrides,
    readOnly: preset === "read-only-preview" || readOnly,
  };
}
