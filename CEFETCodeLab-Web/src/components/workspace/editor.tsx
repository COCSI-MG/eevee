import React from 'react';
import Editor from '@monaco-editor/react';

export interface WorkspaceEditorProps {
  activeFile: string;
  activeFileContent: string;
  getFileIcon: (filename: string) => React.ReactNode;
  handleEditorChange: (value: string | undefined) => void;
}

const WorkspaceEditor: React.FC<WorkspaceEditorProps> = ({
  activeFile,
  activeFileContent,
  getFileIcon,
  handleEditorChange,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="flex justify-between items-center">
          <div className="flex">
            <div className="flex items-center gap-2 px-4 py-3 border-r border-slate-700 cursor-pointer bg-slate-900 border-t-2 border-t-blue-500">
              {getFileIcon(activeFile)}
              <span className="text-sm font-medium">{activeFile}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={activeFileContent === '' ? 'console.log("Hello, World")' : activeFileContent}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
            theme: 'vs-dark',
            hover: { delay: 300, sticky: false },
            parameterHints: { enabled: false },
            suggest: {
              snippetsPreventQuickSuggestions: true,
              showIcons: true,
            },
            inlayHints: { enabled: 'off' },
            quickSuggestions: false,
          }}
        />
      </div>
    </div>
  );
};

export default WorkspaceEditor;
