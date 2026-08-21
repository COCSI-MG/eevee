import type { editor } from "monaco-editor";

const ANSWER_KEY_PATH_PATTERN = /^\/assignment\/[^/]+\/workspace\/answer-key\/?$/;
let allowedEditor: editor.IStandaloneCodeEditor | null = null;

export function registerAllowedEditorActions(
  editorInstance: editor.IStandaloneCodeEditor,
) {
  allowedEditor = editorInstance;

  return () => {
    if (allowedEditor === editorInstance) {
      allowedEditor = null;
    }
  };
}



export function isAllowedEditorAction() {

  return (
    typeof window !== "undefined" &&
    ANSWER_KEY_PATH_PATTERN.test(window.location.pathname) &&
    allowedEditor?.hasTextFocus() === true
  );
}
