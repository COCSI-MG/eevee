"use client";

import * as React from "react";
import { usePreventUserActions } from "@/hooks/use-prevent-user-actions";
import { FileNode, SelectedItem } from "@/types/shared";
import { useEffect } from "react";
import { initStash } from "@/app/integration/filestash";
import { DEFAULT_FILE_NODE } from "@/app/assignment/worker-templates";

interface WorkspaceContextType {
  selectedItem: SelectedItem;
  setSelectedItem: React.Dispatch<React.SetStateAction<SelectedItem>>;
  fileTreeData: FileNode;
  setFileTreeData: React.Dispatch<React.SetStateAction<FileNode>>;
}

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(
  undefined
);

export const useWorkspaceContext = () => {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error(
      "useWorkspaceContext must be used within a WorkspaceProvider"
    );
  }
  return context;
};

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
}) => {
  const [selectedItem, setSelectedItem] = React.useState<SelectedItem>({
    id: "",
    type: "file",
    path: "",
  });
  const [treeData, setTreeData] = React.useState<FileNode>(DEFAULT_FILE_NODE);

  useEffect(() => {
    const initializeStashFn = async () => {
      try {
        await initStash();
      } catch (err) {
        console.error("Error initializing Filestash:", err);
      }
    };
    initializeStashFn();
  }, []);

  usePreventUserActions();

  const value: WorkspaceContextType = {
    selectedItem,
    setSelectedItem,
    fileTreeData: treeData,
    setFileTreeData: setTreeData,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
