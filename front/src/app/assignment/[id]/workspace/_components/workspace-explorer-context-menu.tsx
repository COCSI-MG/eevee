"use client";

interface WorkspaceExplorerContextMenuProps {
  position: {
    x: number;
    y: number;
  };
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onClose: () => void;
}

export function WorkspaceExplorerContextMenu({
  position,
  onCreateFile,
  onCreateFolder,
  onClose,
}: WorkspaceExplorerContextMenuProps) {
  return (
    <div
      className="fixed z-50 min-w-[160px] rounded-md border border-border bg-card py-1 shadow-lg"
      style={{ top: position.y, left: position.x }}
    >
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-primary/20"
        onClick={() => {
          onCreateFile();
          onClose();
        }}
      >
        Criar Arquivo
      </button>
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-primary/20"
        onClick={() => {
          onCreateFolder();
          onClose();
        }}
      >
        Criar Pasta
      </button>
    </div>
  );
}
