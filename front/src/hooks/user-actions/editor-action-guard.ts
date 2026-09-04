import type { editor } from "monaco-editor";

/**
 * Controls how global keyboard and clipboard guards treat a focused editor.
 *
 * - `enforced`: global action guards remain active.
 * - `exempt`: clipboard and non-DevTools editor shortcuts are allowed.
 */
export type EditorActionGuardMode = "enforced" | "exempt";

const editorActionGuardModes = new Map<
  editor.IStandaloneCodeEditor,
  EditorActionGuardMode
>();

export function registerEditorActionGuard(
  editorInstance: editor.IStandaloneCodeEditor,
  mode: EditorActionGuardMode,
) {
  editorActionGuardModes.set(editorInstance, mode);

  return () => {
    editorActionGuardModes.delete(editorInstance);
  };
}

export function isFocusedEditorExemptFromActionGuards(): boolean {
  for (const [editorInstance, mode] of editorActionGuardModes) {
    if (mode === "exempt" && editorInstance.hasTextFocus()) return true;
  }
  return false;
}
