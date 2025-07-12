"use client";

import { getFilePath } from "@/lib/file-path-utils";
import { FileType, NewItem } from "@/types/shared";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getFileFromStash } from "../integration/filestash";
import { DEFAULT_ASSIGNMENT_TEMPLATE } from "../admin/assignments/constants";
import { useWorskpaceResizing } from "@/hooks/use-workspace-resizing";

interface WorkspaceContextProps {
  consoleOutput: string[];
  setConsoleOutput: React.Dispatch<React.SetStateAction<string[]>>;
  activeFile: string;
  setActiveFile: React.Dispatch<React.SetStateAction<string>>;
  activeLocalFilePath: string;
  setActiveLocalFilePath: React.Dispatch<React.SetStateAction<string>>;
  activeFileContent: string;
  setActiveFileContent: React.Dispatch<React.SetStateAction<string>>;
  fileStructure: FileType[];
  setFileStructure: React.Dispatch<React.SetStateAction<FileType[]>>;
  newItem: NewItem;
  setNewItem: React.Dispatch<React.SetStateAction<NewItem>>;
  newItemRef: React.RefObject<HTMLInputElement | null>;
  openFile: (file: FileType) => void;
  getFileStruct: (filePath: string) => FileType | null;
  getFileContentFromStash: (key: string) => Promise<void>;
  explorerWidth: number;
  consoleHeight: number;
}

export const WorkspaceContext = React.createContext<WorkspaceContextProps | null>(null);


export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    "Saída do programa aparecerá aqui",
  ]);
  const [activeFile, setActiveFile] = useState("index.js");
  const [activeLocalFilePath, setActiveLocalFilePath] =
    useState<string>("src/index.js");
  const [activeFileContent, setActiveFileContent] = useState<string>("");

  const { explorerWidth, consoleHeight } = useWorskpaceResizing();

  const [fileStructure, setFileStructure] = useState<FileType[]>([
    {
      id: "1",
      name: "src",
      type: "folder",
      lastModified: new Date(),
      isOpen: true,
      children: [
        {
          id: `2-${Date.now()}`,
          name: "index.js",
          type: "file",
          lastModified: new Date(),
          isOpen: true,
          parentId: "1",
        },
      ],
    },
  ]);

  const [newItem, setNewItem] = useState<NewItem>({
    name: "",
    parentId: null,
    type: "file",
    isCreating: false,
  });

  const newItemRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (newItem.isCreating && newItemRef.current) {
      setTimeout(() => {
        newItemRef.current?.focus();
      }, 0);
    }
  }, [newItem.isCreating]);

  const openFile = (file: FileType) => {
    const filePath = getFilePath(file, fileStructure);
    setActiveFile(filePath.split("/").pop() || "");
    setActiveLocalFilePath(filePath);
  };

  const getFileStruct = useCallback(
    (filePath: string): FileType | null => {
      const findFileByPath = (items: FileType[]): FileType | null => {
        for (const item of items) {
          if (
            item.type === "file" &&
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
    },
    [fileStructure]
  );

  const getFileContentFromStash = async (key: string) => {
    try {
      const fileData = await getFileFromStash(key);
      if (fileData && fileData.data && typeof fileData.data === "string") {
        setActiveFileContent(fileData.data);
      } else {
        console.warn("File not found in stash:", key);
      }
    } catch (error) {
      console.error("Error fetching file from stash:", error);
    }
  };

  useEffect(() => {
    if (activeFileContent === "") {
      setActiveFileContent(DEFAULT_ASSIGNMENT_TEMPLATE);
    }
  }, [activeFileContent]);

  return (
    <WorkspaceContext.Provider
      value={{
        consoleOutput,
        setConsoleOutput,
        activeFile,
        setActiveFile,
        activeLocalFilePath,
        setActiveLocalFilePath,
        activeFileContent,
        setActiveFileContent,
        fileStructure,
        setFileStructure,
        newItem,
        setNewItem,
        newItemRef,
        openFile,
        getFileStruct,
        getFileContentFromStash,
        explorerWidth,
        consoleHeight,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
