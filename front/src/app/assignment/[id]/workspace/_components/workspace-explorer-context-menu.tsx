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
      className="fixed z-50 min-w-[160px] rounded-md border border-gray-700 bg-gray-800 py-1 shadow-lg"
      style={{ top: position.y, left: position.x }}
    >
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700"
        onClick={() => {
          onCreateFile();
          onClose();
        }}
      >
        Create File
      </button>
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700"
        onClick={() => {
          onCreateFolder();
          onClose();
        }}
      >
        Create Folder
      </button>
    </div>
  );
}
