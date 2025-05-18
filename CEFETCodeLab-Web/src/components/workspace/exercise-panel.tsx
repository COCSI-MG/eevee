import React, { RefObject } from 'react';

export interface WorkspaceExercisePanelProps {
  data: { title: string; description: string };
  exercisePanelWidth: number;
  descriptionRef: RefObject<HTMLDivElement>;
  startResize: (element: 'exercise', e: React.MouseEvent) => void;
}

const WorkspaceExercisePanel: React.FC<WorkspaceExercisePanelProps> = ({ data, exercisePanelWidth, descriptionRef, startResize }) => {
  return (
    <>
      <div
        className="exercise-panel w-auto border-r border-slate-700 flex flex-col overflow-hidden"
        style={{ width: exercisePanelWidth }}
      >
        <div className="flex items-center justify-between p-2 border-b border-slate-700 bg-slate-800">
          <h3 className="font-medium text-sm">{data.title}</h3>
        </div>
        <div className="p-4 overflow-y-auto flex-1" ref={descriptionRef}>
          <p className="text-sm font-medium mb-2">{data.description}</p>
        </div>
      </div>
      <div
        className="w-1 bg-slate-700 hover:bg-blue-500 cursor-ew-resize"
        onMouseDown={(e) => startResize('exercise', e)}
      ></div>
    </>
  );
};

export default WorkspaceExercisePanel;
