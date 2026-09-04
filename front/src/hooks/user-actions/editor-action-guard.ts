import type { editor } from "monaco-editor";
import type { EditorActionGuardMode } from "@/constants/editor-action-guard";
export interface EditorActionGuardRegistration {
  editorInstance: editor.IStandaloneCodeEditor;
  mode: EditorActionGuardMode;
  clipboardScope?: string;
}

const editorActionGuardModes = new Map<
  editor.IStandaloneCodeEditor,
  Omit<EditorActionGuardRegistration, "editorInstance">
>();

export function registerEditorActionGuard(
  editorInstance: editor.IStandaloneCodeEditor,
  mode: EditorActionGuardMode,
  clipboardScope?: string,
) {
  editorActionGuardModes.set(editorInstance, { mode, clipboardScope });

  return () => {
    editorActionGuardModes.delete(editorInstance);
  };
}

export function getEditorActionGuard(
  eventTarget?: EventTarget | null,
): EditorActionGuardRegistration | null {
  if (eventTarget instanceof Node) {
    for (const [editorInstance, registration] of editorActionGuardModes) {
      if (editorInstance.getDomNode()?.contains(eventTarget)) {
        return { editorInstance, ...registration };
      }
    }
  }

  for (const [editorInstance, registration] of editorActionGuardModes) {
    if (editorInstance.hasTextFocus()) {
      return { editorInstance, ...registration };
    }
  }

  return null;
}
