import type { ReactNode } from "react";

export function EditorPanelHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-11 min-w-0 shrink-0 items-center gap-2 border-b border-border/25 bg-editor-header/60 px-3">
      {children}
    </div>
  );
}
