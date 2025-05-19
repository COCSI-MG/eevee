import React from 'react';
import { FileType } from '@/types/shared';

export interface WorkspaceExplorerProps {
  explorerWidth: number;
  fileStructure: FileType[];
  renderTree: (items: FileType[], level?: number) => React.ReactNode;
  startResize: (element: 'explorer', e: React.MouseEvent) => void;
}

const WorkspaceExplorer: React.FC<WorkspaceExplorerProps> = ({ explorerWidth, fileStructure, renderTree, startResize }) => {
  return (
    <>
      <div
        className="border-r border-slate-700 overflow-hidden flex flex-col"
        style={{ width: explorerWidth }}
      >
        <div className="p-2 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">EXPLORADOR</h3>
          </div>
        </div>
        <div className="flex-1">
          {renderTree(fileStructure)}
        </div>
      </div>
      <div
        className="w-1 bg-slate-700 hover:bg-blue-500 cursor-ew-resize"
        onMouseDown={(e) => startResize('explorer', e)}
      ></div>
    </>
  );
};

export default WorkspaceExplorer;