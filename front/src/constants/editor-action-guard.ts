/**
 * Controls how global keyboard and clipboard guards treat a focused editor.
 *
 * - `enforced`: global action guards remain active.
 * - `internal-only`: clipboard actions are limited to the current workspace.
 * - `exempt`: clipboard and non-DevTools editor shortcuts are allowed.
 */
export const EDITOR_ACTION_GUARD_MODE = {
  ENFORCED: "enforced",
  INTERNAL_ONLY: "internal-only",
  EXEMPT: "exempt",
} as const;

export type EditorActionGuardMode = (typeof EDITOR_ACTION_GUARD_MODE)[keyof typeof EDITOR_ACTION_GUARD_MODE];
