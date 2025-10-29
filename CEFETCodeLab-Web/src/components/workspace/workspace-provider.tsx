"use client";

import * as React from "react";
import { usePreventUserActions } from "@/hooks/use-prevent-user-actions";
import { FileNode, SelectedItem } from "@/types/shared";
import { useEffect } from "react";
import { initStash } from "@/app/integration/filestash";

interface WorskpaceContextType {
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  selectedItem: SelectedItem;
  setSelectedItem: React.Dispatch<React.SetStateAction<SelectedItem>>;
  fileTreeData: FileNode[];
  setFileTreeData: React.Dispatch<React.SetStateAction<FileNode[]>>;
}

const WorkspaceContext = React.createContext<WorskpaceContextType | undefined>(
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
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedItem, setSelectedItem] =
    React.useState<SelectedItem>({ id: "", name: "", type: "file", path: "" });
  const [treeData, setTreeData] = React.useState<FileNode[]>([]);

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

  const value: WorskpaceContextType = {
    currentStep,
    setCurrentStep,
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
