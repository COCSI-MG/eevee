"use client";

import * as React from "react";
import { AssignmentUserSuspensionService } from "@/app/integration/scheduler-api/assignment-user-suspension";
import { usePreventUserActions } from "@/hooks/use-prevent-user-actions";
import { FileNode, SelectedItem } from "@/types/shared";
import { useEffect } from "react";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useFetchAssignment } from "@/hooks/use-assignments";
import { initStash } from "@/app/integration/filestash";
import {
  createDefaultFileNode,
  DEFAULT_FILE_NODE,
} from "@/app/assignment/worker-templates";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { SecurityViolationReason } from "@/hooks/user-actions/types";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";

interface WorkspaceContextType {
  selectedItem: SelectedItem;
  fileTreeData: FileNode;
  workerType?: WorkerType | string;
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
  initialFileTree?: FileNode;
  enableSecurityGuards?: boolean;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
  workerType,
  boilerplate,
  initialFileTree,
  enableSecurityGuards = true,
}) => {
  const params = useParams();
  const { user } = useAuthContext();
  const userId = user?.userId;
  const assignmentId = Number(params.id);
  const requestedSuspensionReasons = React.useRef(new Set<string>());
  const { data: assignmentData } = useFetchAssignment(assignmentId);
  const isUserSuspended = Boolean(
    userId &&
    assignmentData?.suspensions?.some(
      (suspension) => suspension.userId === userId,
    ),
  );
  const shouldPreventUserActions = Boolean(
    userId && assignmentData && !isUserSuspended,
  );
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
    if (initialFileTree) {
      return initialFileTree;
    }

    if (workerType) {
      return createDefaultFileNode(workerType, boilerplate);
    }

    return DEFAULT_FILE_NODE;
  }, [boilerplate, initialFileTree, workerType]);

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

  const { mutateAsync: suspendUserFromAssignment } = useMutation({
    mutationFn: async (reason: SecurityViolationReason) => {
      if (!Number.isFinite(assignmentId)) {
        return;
      }

      return AssignmentUserSuspensionService.suspendUserFromAssignment(
        assignmentId,
        reason,
      );
    },
  });

  const handleSecurityViolation = React.useCallback(
    async (reason: SecurityViolationReason) => {
      if (isUserSuspended || requestedSuspensionReasons.current.has(reason)) {
        return;
      }

      requestedSuspensionReasons.current.add(reason);
      await suspendUserFromAssignment(reason);
    },
    [isUserSuspended, suspendUserFromAssignment],
  );

  const handleClipboardViolationLimit = React.useCallback(() => {
    handleSecurityViolation("clipboard_attempt_limit");
  }, [handleSecurityViolation]);

  usePreventUserActions({
    enabled: enableSecurityGuards && shouldPreventUserActions,
    clipboardViolationLimit: 10,
    onClipboardViolationLimit: handleClipboardViolationLimit,
    onSecurityViolation: handleSecurityViolation,
  });

  const value: WorkspaceContextType = {
    selectedItem,
    fileTreeData: treeData,
    workerType: workerType ?? assignmentData?.workerType,
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
