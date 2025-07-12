import { useWorkspace } from '@/hooks/use-workspace';
import { cn } from '@/lib/utils';
import React from 'react';

export interface WorkspaceConsoleProps {
  consoleHeight: number;
  startResize: (element: 'console', e: React.MouseEvent) => void;
}

const WorkspaceConsole: React.FC<WorkspaceConsoleProps> = ({
  consoleHeight,
  startResize,
}) => {
  const {
    consoleOutput
  } = useWorkspace();

  return (
    <>
      <div
        className="w-full bg-slate-700 hover:bg-blue-500 h-1 cursor-ns-resize"
        onMouseDown={(e) => startResize('console', e)}
      ></div>
      <div
        className="overflow-hidden flex flex-col"
        style={{ height: consoleHeight }}
      >
        <div className="bg-slate-800 px-3 py-2 border-b border-slate-700">
          <span className="text-sm font-medium">Console</span>
        </div>
        <div className="flex-1 overflow-auto bg-black p-3 font-mono text-sm">
          {consoleOutput.map((line, index) => (
            <div
              key={index}
              className={cn(
                (line.startsWith('>') && 'text-green-400') ||
                  (line.startsWith('Error:') && 'text-red-400') ||
                  (line.startsWith('Report:') && 'text-yellow-400'),
                'whitespace-pre-wrap'
              )}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default WorkspaceConsole;
