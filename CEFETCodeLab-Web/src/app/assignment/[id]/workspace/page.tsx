'use client';

import type React from 'react';

import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { useParams } from 'next/navigation';
import { SchedulingService } from '@/app/integration/scheduler-api/scheduling';
import { toast } from '@/hooks/use-toast';
import WorkspaceHeader from '@/components/workspace/header';
import WorkspaceExplorer from '@/components/workspace/explorer';
import WorkspaceEditor from '@/components/workspace/editor';
import WorkspaceConsole from '@/components/workspace/console';
import { FileType, NewItem } from '@/types/shared';
import {
  getFileFromStash,
  initStash,
  upsertFileInStash,
} from '@/app/integration/filestash';
import { getFilePath } from '@/lib/file-path-utils';
import { DEFAULT_ASSIGNMENT_TEMPLATE } from '@/app/admin/assignments/constants';
import { useAuthUser } from '@/hooks/use-auth-user';
import FileSaverService from '@/app/integration/scheduler-api/file-saver';

export default function AssignmentWorkspace() {
  const { id } = useParams();
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    'Saída do programa aparecerá aqui',
  ]);
  const [activeFile, setActiveFile] = useState('index.js');
  const [activeLocalFilePath, setActiveLocalFilePath] =
    useState<string>('src/index.js');
  const [activeFileContent, setActiveFileContent] = useState<string>('');
  const [explorerWidth, setExplorerWidth] = useState(224); // 56 * 4 = 224px
  const [exercisePanelWidth, setExercisePanelWidth] = useState(288); // 72 * 4 = 288px
  const [consoleHeight, setConsoleHeight] = useState(128); // 32 * 4 = 128px
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
          id: `2-${Date.now()}`,
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
  const [focusCount, setFocusCount] = useState(0);
  const newItemRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthUser();

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
        applicationFileContent: activeFileContent,
      });
    },
    onError: (error) => {
      console.error('Error submitting assignment:', error);
      setConsoleOutput((prev) => [
        ...prev,
        'Error: Ocorreu um erro ao submeter a tarefa.',
      ]);
    },
  });

  const {
    mutate: saveFileInStash,
    isPending: isSaving,
    isError: isSavingError,
    data: savedFile,
  } = useMutation({
    mutationKey: ['save-file'],
    mutationFn: (activeFileStructure: FileType) => {
      if (!data) {
        console.error('No assignment data available');
        return Promise.reject('No assignment data available');
      }

      const filePath = getFilePath(activeFileStructure, fileStructure);
      const key = `${data.id}/${activeFileStructure.id}/${filePath}`;
      console.log('activeFileContent:', activeFileContent);
      return upsertFileInStash(
        {
          name: filePath,
          data: activeFileContent,
          size: activeFileContent.length,
          createdAt: new Date().toISOString(),
          updateAt: new Date().toISOString(),
        },
        key
      );
    },
  });

  const { mutate: saveFileAtServer, isPending: isSavingAtServer } = useMutation(
    {
      mutationKey: ['save-file-at-server'],
      mutationFn: (file: File) => {
        if (!data) {
          console.error('No assignment data available');
          return Promise.reject('No assignment data available');
        }
        if (!user) {
          console.error('No user data available');
          return Promise.reject('No user data available');
        }
        return FileSaverService.uploadFileToServer(
          file,
          Number(data.id),
          Number(user.id)
        );
      },
    }
  );

  useEffect(() => {
    window.addEventListener('focus', () => {
      setFocusCount((prev) => prev + 1);
    });
  }, []);

  useEffect(() => {
    if (focusCount > 5) {
      setTimeout(() => {
        setFocusCount(0);
      }, 10000);

      console.log('Focus count exceeded 5, redirecting to home');

      setTimeout(() => {
        window.location.href = '/';
      }, 5000);
    }
  }, [focusCount]);

  useEffect(() => {
    if (!isPending && workerResult) {
      console.log('Worker result:', workerResult);
      setConsoleOutput((prev) => [
        ...prev,
        `> Score: ${workerResult.score}`,
        `> Passes: ${workerResult.passes}`,
        `> Fails: ${workerResult.fails}`,
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
    return () => {
      document.removeEventListener('contextmenu', preventDefaultAction);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
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

  useEffect(() => {
    const localStorageFileStructure = localStorage.getItem(
      `file-Structure-assignment-${id}`
    );
    if (localStorageFileStructure) {
      const parsedFileStructure = JSON.parse(localStorageFileStructure);
      setFileStructure(parsedFileStructure);
    }
  }, [id]);

  useEffect(() => {
    localStorage.setItem(
      `file-Structure-assignment-${id}`,
      JSON.stringify(fileStructure)
    );
  }, [fileStructure, id]);

  useEffect(() => {
    if (isSavingError) {
      console.error('Error saving file:', savedFile);
      toast({
        title: 'Erro ao salvar o arquivo',
        description: 'Ocorreu um erro ao salvar o arquivo.',
        variant: 'destructive',
      });
      return;
    }
    if (!isSaving && savedFile) {
      toast({
        title: 'Arquivo salvo com sucesso',
        variant: 'default',
      });
    }
  }, [savedFile, isSaving, isSavingError]);

  useEffect(() => {
    const initializeStashFn = async () => {
      try {
        await initStash();
      } catch (err) {
        console.error('Error initializing Filestash:', err);
      }
    };
    initializeStashFn();
  }, []);

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

  const openFile = (file: FileType) => {
    const filePath = getFilePath(file, fileStructure);
    setActiveFile(filePath.split('/').pop() || '');
    setActiveLocalFilePath(filePath);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      const updatedStructure = [...fileStructure];
      // Find and update the file content by path
      const updateFileContent = (items: FileType[]): boolean => {
        for (const item of items) {
          // Check if this is the active file by comparing paths
          if (
            item.type === 'file' &&
            getFilePath(item, fileStructure) === activeFile
          ) {
            item.lastModified = new Date();
            return true;
          }

          // Recursively search children
          if (item.children && updateFileContent(item.children)) {
            return true;
          }
        }
        return false;
      };

      updateFileContent(updatedStructure);
      setFileStructure(updatedStructure);
      setActiveFileContent(value);
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.html'))
      return <FileText className="h-4 w-4 text-orange-400" />;
    if (filename.endsWith('.css') || filename.endsWith('.ts'))
      return <FileText className="h-4 w-4 text-blue-400" />;
    if (filename.endsWith('.js'))
      return <FileText className="h-4 w-4 text-yellow-400" />;
    return <FileText className="h-4 w-4" />;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getFileStruct = (filePath: string): FileType | null => {
    const findFileByPath = (items: FileType[]): FileType | null => {
      for (const item of items) {
        if (
          item.type === 'file' &&
          getFilePath(item, fileStructure) === filePath
        ) {
          return item;
        }
        if (item.children) {
          const found = findFileByPath(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findFileByPath(fileStructure);
  };

  useEffect(() => {
    const getFileContentFromStash = async (key: string) => {
      try {
        const fileData = await getFileFromStash(key);
        if (fileData && fileData.data && typeof fileData.data === 'string') {
          setActiveFileContent(fileData.data);
        } else {
          console.warn('File not found in stash:', key);
        }
      } catch (error) {
        console.error('Error fetching file from stash:', error);
      }
    };

    if (activeLocalFilePath && data && activeFileContent === '') {
      const fileStruct = getFileStruct(activeLocalFilePath);
      if (!fileStruct) {
        console.error(
          'File structure not found for path:',
          activeLocalFilePath
        );
        return;
      }
      const fileKey = `${data.id}/${fileStruct.id}/${activeLocalFilePath}`;
      getFileContentFromStash(fileKey);
    }
  }, [activeFileContent, activeLocalFilePath, data, getFileStruct]);

  useEffect(() => {
    if (activeFileContent === '') {
      setActiveFileContent(DEFAULT_ASSIGNMENT_TEMPLATE);
    }
  }, [activeFileContent]);

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

  const handleFileLocalSave = () => {
    const struct = getFileStruct(activeLocalFilePath);
    if (!struct) {
      console.error('Error getting struct');
      return;
    }
    saveFileInStash(struct);
  };

  const handleActiveFileDeleted = () => {
    const findFirstFile = (items: FileType[]): FileType | null => {
      for (const item of items) {
        if (item.type === 'file') {
          return item;
        }
        if (item.children) {
          const foundFile = findFirstFile(item.children);
          if (foundFile) {
            return foundFile;
          }
        }
      }
      return null;
    };

    const firstAvailableFile = findFirstFile(fileStructure);

    if (firstAvailableFile) {
      openFile(firstAvailableFile);
    } else {
      setActiveFile('');
      setActiveFileContent('');
    }
  };

  const handleSave = () => {
    if (activeFileContent === '') {
      toast({
        title: 'Erro',
        description: 'O arquivo está vazio.',
        variant: 'destructive',
      });
      return;
    }
    saveFileAtServer(
      new File([activeFileContent], activeLocalFilePath, {
        type: 'text/plain',
      })
    );
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
      <WorkspaceHeader assignmentDescription={data.description}  />

      {focusCount === 5 && (
        <div className="flex items-center justify-center h-screen opacity-50 bg-black fixed inset-0 z-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Atenção!</h1>
            <p className="text-lg mb-4">
              Você está tentando acessar outra aba ou janela do navegador.
            </p>
            <p className="text-sm text-gray-500">
              Se você continuar, será redirecionado para a página inicial.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden explorer-panel">
            <WorkspaceExplorer
              explorerWidth={explorerWidth}
              fileStructure={fileStructure}
              startResize={startResize}
              activeFile={activeFile}
              newItem={newItem}
              onActiveFileDeleted={handleActiveFileDeleted}
              openFile={openFile}
              toggleFolder={toggleFolder}
              setNewItem={setNewItem}
              setFileStructure={setFileStructure}
              getFileIcon={getFileIcon}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <WorkspaceEditor
                activeFile={activeFile}
                activeFileContent={activeFileContent}
                getFileIcon={getFileIcon}
                handleEditorChange={handleEditorChange}
                handleRun={handleRun}
                isPending={isPending}
                handleSave={handleSave}
                isSavingAtServer={isSavingAtServer}
                handleLocalSave={handleFileLocalSave}
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
