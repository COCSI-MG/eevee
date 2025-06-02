import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../ui/button';
import { Loader2Icon, Play, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

export interface WorkspaceEditorProps {
  activeFile: string;
  activeFileContent: string;
  getFileIcon: (filename: string) => React.ReactNode;
  handleEditorChange: (value: string | undefined) => void;
  handleRun: () => void;
  isPending: boolean;
  handleSave: () => void;
  handleLocalSave: () => void;
}

const WorkspaceEditor: React.FC<WorkspaceEditorProps> = ({
  activeFile,
  activeFileContent,
  getFileIcon,
  handleEditorChange,
  handleRun,
  isPending,
  handleSave,
  handleLocalSave,
}) => {
  const editorRef = React.useRef<
    import('monaco-editor').editor.IStandaloneCodeEditor | null
  >(null);

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
          <div className="flex items-center gap-3 px-4 py-2">
            <Button
              size={'sm'}
              className={cn(
                'bg-green-600 hover:bg-green-700 h-9 px-4',
                isPending && 'cursor-not-allowed'
              )}
              onClick={handleRun}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run
            </Button>
            <Button
              variant={'outline'}
              size={'sm'}
              className="h-9 px-4"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Save</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={activeFileContent}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
            hover: { delay: 300, sticky: false },
            parameterHints: { enabled: false },
            suggest: {
              snippetsPreventQuickSuggestions: true,
              showIcons: true,
            },
            inlayHints: { enabled: 'off' },
            quickSuggestions: false,
          }}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            const container = editor.getDomNode();
            container?.addEventListener('keydown', (e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleLocalSave();
              }
            });
            editor.addCommand(
              monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
              () => {
                handleLocalSave();
              }
            );
          }}
        />
      </div>
    </div>
  );
};

export default WorkspaceEditor;
