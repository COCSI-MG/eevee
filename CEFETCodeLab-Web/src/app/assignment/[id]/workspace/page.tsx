'use client';

import type React from 'react';

import { useEffect, useRef, useState } from 'react';
import {
  FileText,
  FolderIcon,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileCode,
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { useParams } from 'next/navigation';
import { SchedulingService } from '@/app/integration/scheduler-api/scheduling';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import WorkspaceHeader from '@/components/workspace/header';
import WorkspaceExercisePanel from '@/components/workspace/exercise-panel';
import WorkspaceExplorer from '@/components/workspace/explorer';
import WorkspaceEditor from '@/components/workspace/editor';
import WorkspaceConsole from '@/components/workspace/console';
import { FileType, NewItem } from '@/types/shared';

export default function AssignmentWorkspace() {
  const { id } = useParams();
  const [showExercisePanel, setShowExercisePanel] = useState(true);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    'Saída do programa aparecerá aqui',
  ]);
  const [activeFile, setActiveFile] = useState('index.js');
  const [activeFileContent, setActiveFileContent] = useState<string>('');
  const [explorerWidth, setExplorerWidth] = useState(224); // 56 * 4 = 224px
  const [exercisePanelWidth, setExercisePanelWidth] = useState(288); // 72 * 4 = 288px
  const [consoleHeight, setConsoleHeight] = useState(128); // 32 * 4 = 128px
  const descriptionRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const resizingElementRef = useRef<'explorer' | 'exercise' | 'console' | null>(
    null
  );
  const startPositionRef = useRef(0);
  const startSizeRef = useRef(0);
  const [fileStructure, setFileStructure] = useState<FileType[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      lastModified: new Date(),
      isOpen: true,
      children: [
        {
          id: '2',
          name: 'index.js',
          type: 'file',
          lastModified: new Date(),
          isOpen: true,
          parentId: '1',
        },
      ],
    },
  ]);
  const [newItem, setNewItem] = useState<NewItem>({
    name: '',
    parentId: null,
    type: 'file',
    isCreating: false,
  });
  const newItemRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['assigment', id],
    queryFn: ({ queryKey }) => {
      return AssignmentService.GetAssignmentById(Number(queryKey[1]));
    },
  });

  const {
    mutate: submitAssignment,
    isPending,
    data: workerResult,
  } = useMutation({
    mutationKey: ['submit-assignment'],
    mutationFn: () => {
      return SchedulingService.createScheduling({
        assignmentId: Number(id),
        applicationFileContent: getFileContent(activeFile),
      });
    },
  });

  useEffect(() => {
    if (!isPending && workerResult) {
      console.log('Worker result:', workerResult);
      setConsoleOutput((prev) => [
        ...prev,
        `Score: ${workerResult.score}`,
        `Passes: ${workerResult.passes}`,
        `Fails: ${workerResult.fails}`,
        `Report: ${workerResult.report.replace(/\\n/g, '\n')}`,
      ]);
    }
  }, [isPending, workerResult]);

  // Prevent right-click, keyboard shortcuts, and other ways to access DevTools or copy content
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.href.includes('localhost')) return;
    const preventDefaultAction = (e: Event) => {
      e.preventDefault();
      return false;
    };
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevent Ctrl+Shift+I, F12, Ctrl+U, Ctrl+C on exercise panel
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'c') ||
        (e.ctrlKey && e.key === 'a')
      ) {
        e.preventDefault();
        return false;
      }
    };
    // Prevent context menu (right-click)
    document.addEventListener('contextmenu', preventDefaultAction);
    // Prevent keyboard shortcuts
    document.addEventListener('keydown', preventKeyboardShortcuts);
    // Prevent text selection in exercise panel
    const exercisePanel = document.querySelector('.exercise-panel');
    if (exercisePanel) {
      exercisePanel.addEventListener('selectstart', preventDefaultAction);
    }
    return () => {
      document.removeEventListener('contextmenu', preventDefaultAction);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      if (exercisePanel) {
        exercisePanel.removeEventListener('selectstart', preventDefaultAction);
      }
    };
  }, []);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !resizingElementRef.current) return;

      if (resizingElementRef.current === 'explorer') {
        const newWidth =
          startSizeRef.current + (e.clientX - startPositionRef.current);
        if (newWidth >= 150 && newWidth <= 400) {
          setExplorerWidth(newWidth);
        }
      } else if (resizingElementRef.current === 'exercise') {
        const newWidth =
          startSizeRef.current + (e.clientX - startPositionRef.current);
        if (newWidth >= 200 && newWidth <= 500) {
          setExercisePanelWidth(newWidth);
        }
      } else if (resizingElementRef.current === 'console') {
        const newHeight =
          startSizeRef.current - (e.clientY - startPositionRef.current);
        if (newHeight >= 80 && newHeight <= 400) {
          setConsoleHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      resizingElementRef.current = null;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (newItem.isCreating && newItemRef.current) {
      setTimeout(() => {
        newItemRef.current?.focus();
      }, 0);
    }
  }, [newItem.isCreating]);

  const startResize = (
    element: 'explorer' | 'exercise' | 'console',
    e: React.MouseEvent
  ) => {
    isResizingRef.current = true;
    resizingElementRef.current = element;

    if (element === 'explorer') {
      startPositionRef.current = e.clientX;
      startSizeRef.current = explorerWidth;
      document.body.style.cursor = 'ew-resize';
    } else if (element === 'exercise') {
      startPositionRef.current = e.clientX;
      startSizeRef.current = exercisePanelWidth;
      document.body.style.cursor = 'ew-resize';
    } else if (element === 'console') {
      startPositionRef.current = e.clientY;
      startSizeRef.current = consoleHeight;
      document.body.style.cursor = 'ns-resize';
    }

    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const toggleExercisePanel = () => {
    setShowExercisePanel(!showExercisePanel);
  };

  const openFile = (filename: string, content?: string) => {
    setActiveFile(filename);
    if (content) {
      setActiveFileContent(content);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      const updatedStructure = [...fileStructure];
      // Find and update the file content
      for (const folder of updatedStructure) {
        const file = folder.children?.find(
          (f: FileType) => f.name === activeFile
        );
        if (file && file.type === 'file') {
          file.content = value;
          file.lastModified = new Date();
          break;
        }
      }
      setFileStructure(updatedStructure);
      setActiveFileContent(value);
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.html'))
      return <FileText className="h-4 w-4 text-orange-400" />;
    if (filename.endsWith('.css'))
      return <FileText className="h-4 w-4 text-blue-400" />;
    if (filename.endsWith('.js'))
      return <FileText className="h-4 w-4 text-yellow-400" />;
    return <FileText className="h-4 w-4" />;
  };

  const getFileContent = (filename: string): string => {
    for (const folder of fileStructure) {
      const file = folder.children?.find((f: FileType) => f.name === filename);
      if (file && file.type === 'file' && file.content) {
        return file.content;
      }
    }
    return '';
  };

  const toggleFolder = (folderId: string) => {
    const updatedStructure = [...fileStructure];
    const toggleFolderOpen = (items: FileType[]) => {
      for (const item of items) {
        if (item.id === folderId && item.type === 'folder') {
          item.isOpen = !item.isOpen;
          return true;
        }
        if (item.children) {
          if (toggleFolderOpen(item.children)) return true;
        }
      }
      return false;
    };
    toggleFolderOpen(updatedStructure);
    setFileStructure(updatedStructure);
  };

  const renderTree = (items: FileType[], level = 0) => {
    return items
      .map((item) => {
        return (
          <div key={item.id} className="relative">
            <ContextMenu>
              <ContextMenuTrigger
                disabled={item.type === 'file' || !item.isOpen}
              >
                <div
                  className={`flex items-center gap-1 text-sm py-1 px-1 rounded cursor-pointer group ${
                    item.type === 'file' && item.name === activeFile
                      ? 'bg-slate-700'
                      : 'hover:bg-slate-800'
                  }`}
                  style={{ paddingLeft: `${level * 12 + 4}px` }}
                  onClick={() => {
                    if (item.type === 'file') {
                      openFile(item.name, item.content);
                    } else if (item.type === 'folder') {
                      if (newItem.isCreating) {
                        setNewItem({
                          ...newItem,
                          isCreating: false,
                          name: '',
                        });
                      }
                      toggleFolder(item.id);
                    }
                  }}
                >
                  {item.type === 'folder' && (
                    <div className="flex-shrink-0">
                      {item.isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  )}

                  {item.type === 'folder' ? (
                    item.isOpen ? (
                      <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-300" />
                    ) : (
                      <FolderIcon className="h-4 w-4 flex-shrink-0 text-blue-300" />
                    )
                  ) : (
                    getFileIcon(item.name)
                  )}

                  <span className="truncate flex-grow">{item.name}</span>
                </div>

                {newItem.isCreating &&
                  newItem.parentId === item.id &&
                  item.type === 'folder' && (
                    <div className="ml-2">
                      <div
                        className="flex items-center gap-1 pl-2 mt-1"
                        style={{ paddingLeft: `${(level + 1) * 12}px` }}
                      >
                        {newItem.type === 'folder' ? (
                          <FolderIcon className="h-4 w-4 flex-shrink-0 text-blue-300" />
                        ) : (
                          <FileText className="h-4 w-4 flex-shrink-0 text-blue-300" />
                        )}
                        <div className="flex items-center flex-grow">
                          <Input
                            ref={newItemRef}
                            value={newItem.name}
                            onChange={(e) => {
                              if (
                                item.children
                                  ?.map((child: FileType) => child.name)
                                  .includes(e.target.value)
                              ) {
                                toast({
                                  title: 'Nome do arquivo já existe',
                                  description: 'Escolha um nome diferente.',
                                  variant: 'destructive',
                                });
                                return;
                              }

                              setNewItem({
                                ...newItem,
                                name: e.target.value,
                              });
                            }}
                            className="h-6 py-0 text-sm bg-slate-800 border-slate-600"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const updatedStructure = [...fileStructure];
                                const newId = `new-${Date.now()}`;
                                const newItemData: FileType = {
                                  id: newId,
                                  name: newItem.name,
                                  type: newItem.type,
                                  lastModified: new Date(),
                                  parentId:
                                    typeof item.id === 'undefined'
                                      ? undefined
                                      : item.id,
                                  isOpen: false,
                                  children: [],
                                };
                                item.children?.push(newItemData);
                                setFileStructure(updatedStructure);
                                setNewItem({
                                  ...newItem,
                                  isCreating: false,
                                  name: '',
                                });
                              } else {
                                if (e.key === 'Escape') {
                                  setNewItem({
                                    ...newItem,
                                    isCreating: false,
                                    name: '',
                                  });
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                {item.type === 'folder' && item.children && item.isOpen && (
                  <div className="ml-2">
                    {renderTree(item.children, level + 1)}
                  </div>
                )}
              </ContextMenuTrigger>
              <ContextMenuContent className="w-64">
                <ContextMenuItem
                  onClick={() => {
                    setNewItem({
                      name: '',
                      parentId: item.id,
                      type: 'file',
                      isCreating: true,
                    });
                  }}
                >
                  <FileCode className="h-4 w-4 mr-2" />
                  <span>Criar arquivo</span>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        );
      })
      .filter(Boolean);
  };

  const handleRun = () => {
    if (activeFileContent === '') {
      toast({
        title: 'Erro',
        description: 'O arquivo está vazio.',
        variant: 'destructive',
      });
      return;
    }
    setConsoleOutput(['Enviando para teste...']);
    submitAssignment();
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        <span className="ml-4 text-lg">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      <WorkspaceHeader
        showExercisePanel={showExercisePanel}
        toggleExercisePanel={toggleExercisePanel}
      />
      <div className="flex flex-1 overflow-hidden">
        {showExercisePanel && (
          <WorkspaceExercisePanel
            data={{ title: data.title, description: data.description }}
            exercisePanelWidth={exercisePanelWidth}
            descriptionRef={descriptionRef as React.RefObject<HTMLDivElement>}
            startResize={startResize}
          />
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden explorer-panel">
            <WorkspaceExplorer
              explorerWidth={explorerWidth}
              fileStructure={fileStructure}
              renderTree={renderTree}
              startResize={startResize}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <WorkspaceEditor
                activeFile={activeFile}
                activeFileContent={activeFileContent}
                getFileIcon={getFileIcon}
                handleEditorChange={handleEditorChange}
                handleRun={handleRun}
                isPending={isPending}
                handleSave={() => {
                  //TODO: Implement save functionality
                }}
              />
              <WorkspaceConsole
                consoleHeight={consoleHeight}
                startResize={startResize}
                consoleOutput={consoleOutput}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
