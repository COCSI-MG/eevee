"use client";

import * as React from "react";
import { AssignmentUserSuspensionService } from "@/app/integration/scheduler-api/assignment-user-suspension";
import { usePreventUserActions } from "@/hooks/use-prevent-user-actions";
import { FileNode, SelectedItem } from "@/types/shared";
import { useEffect } from "react";
import { initStash } from "@/app/integration/filestash";
import {
  createDefaultFileNode,
  DEFAULT_FILE_NODE,
} from "@/app/assignment/worker-templates";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";

interface WorkspaceContextType {
  selectedItem: SelectedItem;
  fileTreeData: FileNode;
  selectItem: (item: SelectedItem) => void;
  clearSelection: () => void;
  replaceFileTree: (fileTree: FileNode) => void;
}

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(
  undefined,
);

export const useWorkspaceContext = () => {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error(
      "useWorkspaceContext must be used within a WorkspaceProvider",
    );
  }
  return context;
};

interface WorkspaceProviderProps {
  children: React.ReactNode;
  workerType?: WorkerType;
  boilerplate?: string;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
  workerType,
  boilerplate,
}) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const assignmentId = Number(params.id);
  const hasRequestedClipboardSuspension = React.useRef(false);
  const emptySelectedItem = React.useMemo<SelectedItem>(
    () => ({
      id: "",
      type: "file",
      path: "",
    }),
    [],
  );

  const [selectedItem, setSelectedItem] = React.useState<SelectedItem>({
    id: "",
    type: "file",
    path: "",
  });

  const initialFileNode = React.useMemo(() => {
    if (workerType) {
      return createDefaultFileNode(workerType, boilerplate);
    }
    return DEFAULT_FILE_NODE;
  }, [workerType, boilerplate]);

  const [treeData, setTreeData] = React.useState<FileNode>(initialFileNode);

  const selectItem = React.useCallback((item: SelectedItem) => {
    setSelectedItem(item);
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedItem(emptySelectedItem);
  }, [emptySelectedItem]);

  const replaceFileTree = React.useCallback((fileTree: FileNode) => {
    setTreeData(fileTree);
  }, []);

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

  const { mutate: suspendUserFromAssignment } = useMutation({
    mutationFn: async () => {
      if (!Number.isFinite(assignmentId)) {
        return;
      }

      return AssignmentUserSuspensionService.suspendUserFromAssignment(
        assignmentId,
        "clipboard_attempt_limit",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["assignment", assignmentId],
      });
    },
  });

  const handleClipboardViolationLimit = React.useCallback(() => {
    if (hasRequestedClipboardSuspension.current) {
      return;
    }

    hasRequestedClipboardSuspension.current = true;
    suspendUserFromAssignment();
  }, [suspendUserFromAssignment]);

  usePreventUserActions({
    clipboardViolationLimit: 10,
    onClipboardViolationLimit: handleClipboardViolationLimit,
  });

  const value: WorkspaceContextType = {
    selectedItem,
    fileTreeData: treeData,
    selectItem,
    clearSelection,
    replaceFileTree,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
