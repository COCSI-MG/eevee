import type { editor } from "monaco-editor";

/**
 * Controls how global keyboard and clipboard guards treat a focused editor.
 *
 * - `enforced`: global action guards remain active.
 * - `internal-only`: clipboard actions are limited to the current workspace.
 * - `exempt`: clipboard and non-DevTools editor shortcuts are allowed.
 */
export type EditorActionGuardMode = "enforced" | "internal-only" | "exempt";

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
