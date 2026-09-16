"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AssignmentAlertService } from "@/app/integration/scheduler-api/assignment-alert";
import {
  AssignmentAlertStatus,
  AssignmentAlertType,
  RecordAssignmentAlertRequest
} from "@/app/interface/scheduler-api/assignment-alert";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { usePreventUserActions } from "@/hooks/use-prevent-user-actions";
import { SecurityViolationEvent } from "@/hooks/user-actions/types";
import { FileNode, SelectedItem } from "@/types/shared";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useFetchAssignment } from "@/hooks/use-assignments";
import { initStash } from "@/app/integration/filestash";
import {
  createDefaultFileNode,
  DEFAULT_FILE_NODE,
} from "@/app/assignment/worker-templates";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import {
  WORKSPACE_DRAG_AREA_SELECTOR,
  WORKSPACE_DRAG_MIME_TYPE,
} from "../_utils/constant";
import { clearInternalEditorClipboard } from "@/hooks/user-actions/internal-editor-clipboard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface WorkspaceContextType {
  selectedItem: SelectedItem;
  fileTreeData: FileNode;
  workerType?: WorkerType | string;
  clipboardScope: string;
  securityPaused: boolean;
  securityAgreementAccepted: boolean;
  registerTypedText: (text: string) => void;
  acceptSecurityAgreement: () => void;
  selectItem: (item: SelectedItem) => void;
  clearSelection: () => void;
  replaceFileTree: (fileTree: FileNode) => void;
}

interface SecurityWarning {
  eventId?: string;
  event: SecurityViolationEvent;
  punitive: boolean;
  status?: AssignmentAlertStatus;
  pending?: boolean;
}

const VIOLATION_LABELS: Record<AssignmentAlertType, string> = {
  [AssignmentAlertType.WindowFocusLoss]: "Você saiu da tela da atividade.",
  [AssignmentAlertType.DevTools]: "Foi detectada uma tentativa de abrir as ferramentas do desenvolvedor.",
  [AssignmentAlertType.Clipboard]: "Foi bloqueada uma tentativa de copiar, recortar ou colar conteúdo.",
  [AssignmentAlertType.TypingRate]: "A velocidade de digitação configurada para esta atividade foi excedida.",
  [AssignmentAlertType.LegacySuspension]: "Foi detectada uma infração.",
};

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

function pendingStorageKey(assignmentId: number, userId: number) {
  return `pending-assignment-alerts:${assignmentId}:user:${userId}`;
}

function readPendingAlerts(
  assignmentId: number,
  userId: number,
): RecordAssignmentAlertRequest[] {
  try {
    return JSON.parse(localStorage.getItem(pendingStorageKey(assignmentId, userId)) ?? "[]") as RecordAssignmentAlertRequest[];
  } catch {
    return [];
  }
}

function writePendingAlerts(
  assignmentId: number,
  userId: number,
  alerts: RecordAssignmentAlertRequest[],
) {
  try {
    localStorage.setItem(pendingStorageKey(assignmentId, userId), JSON.stringify(alerts));
  } catch (error) {
    console.warn("Não foi possível persistir a fila de alertas:", error);
  }
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
  workerType,
  boilerplate,
  initialFileTree,
  enableSecurityGuards = true,
}) => {
  const params = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const currentUserId = user?.userId ?? 0;
  const assignmentId = Number(params.id);
  const workspaceInstanceId = React.useId();
  const clipboardScope = `assignment:${assignmentId}:workspace:${workspaceInstanceId}`;

  const { data: assignmentData, refetch: refetchAssignment } = useFetchAssignment(assignmentId);

  const statusQuery = useQuery({
    queryKey: ["assignment-alert-status", assignmentId],
    queryFn: () => AssignmentAlertService.getMyStatus(assignmentId),
    enabled: Boolean(
      user?.userId &&
        !user.isAdmin &&
        Number.isInteger(assignmentId) &&
        assignmentId > 0
    ),
    refetchInterval: 5000,
    refetchOnWindowFocus: true
  });

  const [securityAgreementAccepted, setSecurityAgreementAccepted] = React.useState(false);
  const isUserSuspended = Boolean(assignmentData?.currentUserAlertStatus?.suspended);
  const shouldPreventUserActions = Boolean(
    enableSecurityGuards && user?.userId &&
    !user.isAdmin && assignmentData &&
    securityAgreementAccepted && !isUserSuspended
  );
  const [securityWarning, setSecurityWarning] = React.useState<SecurityWarning | null>(null);
  const [securityPaused, setSecurityPaused] = React.useState(false);
  const typingTimestamps = React.useRef<number[]>([]);
  const inFlightEventIds = React.useRef(new Set<string>());
  const retryTimers = React.useRef(new Set<number>());

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

  React.useEffect(() => {
    initStash().catch((error) => {
      console.error("Error initializing Filestash:", error);
    });
  }, []);

  React.useEffect(() => {
    if (!assignmentData?.alertPolicy || user?.isAdmin) return;

    const version = assignmentData.alertPolicy.version ?? 1;

    try {
      const securityAgreementAcceptedLocal = localStorage.getItem(`agreement-${assignmentId}-user-${currentUserId}-v${version}`) === "true"
      setSecurityAgreementAccepted(securityAgreementAcceptedLocal);
    } catch {
      setSecurityAgreementAccepted(false);
    }
  }, [
    assignmentData?.alertPolicy,
    assignmentId,
    currentUserId,
    user?.isAdmin
  ]);

  React.useEffect(
    () => () => clearInternalEditorClipboard(clipboardScope),
    [clipboardScope]
  );

  const removePendingAlert = React.useCallback(
    (eventId: string) => {
      const remaining = readPendingAlerts(assignmentId, currentUserId).filter((alert) => alert.eventId !== eventId);

      writePendingAlerts(assignmentId, currentUserId, remaining);
    },
    [assignmentId, currentUserId],
  );

  const updateAssignmentStatus = React.useCallback(
    (status: AssignmentAlertStatus) => {
      queryClient.setQueryData<Assignment>(
        ["assignment", assignmentId],
        (current) => current ? { ...current, currentUserAlertStatus: status } : current
      );

      queryClient.setQueryData(
        ["assignment-alert-status", assignmentId],
        status
      );
    },
    [assignmentId, queryClient],
  );

  React.useEffect(() => {
    const status = statusQuery.data;
    if (!status) return;

    const shouldReloadAssignment =
      !status.suspended &&
      (!assignmentData ||
        assignmentData.currentUserAlertStatus?.suspended ||
        assignmentData.alertPolicy?.suspensionAlertLimit !== status.limit
      );

    updateAssignmentStatus(status);
    if (shouldReloadAssignment) {
      refetchAssignment();
    }
  }, [
    assignmentData,
    refetchAssignment,
    statusQuery.data,
    updateAssignmentStatus,
  ]);

  React.useEffect(() => {
    if (
      !user?.userId ||
      user.isAdmin ||
      statusQuery.data?.suspended
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      refetchAssignment();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [refetchAssignment, statusQuery.data?.suspended, user?.isAdmin, user?.userId]);

  const sendPendingAlert = React.useCallback(
    async (payload: RecordAssignmentAlertRequest, retryAttempt = 0) => {
      if (inFlightEventIds.current.has(payload.eventId)) return;

      inFlightEventIds.current.add(payload.eventId);

      try {
        const response = await AssignmentAlertService.record(assignmentId, payload);

        removePendingAlert(payload.eventId);
        updateAssignmentStatus(response);
        setSecurityWarning((current) => current?.eventId === payload.eventId ? { ...current, status: response, pending: false } : current);
      } catch (error) {
        console.error("Falha ao registrar alerta da atividade:", error);
        setSecurityWarning((current) => current?.eventId === payload.eventId ? { ...current, pending: true } : current);

        const delay = Math.min(30000, 1000 * 2 ** retryAttempt);

        const timer = window.setTimeout(() => {
          retryTimers.current.delete(timer);
          sendPendingAlert(payload, retryAttempt + 1);
        }, delay);

        retryTimers.current.add(timer);
      } finally {
        inFlightEventIds.current.delete(payload.eventId);
      }
    },
    [assignmentId, removePendingAlert, updateAssignmentStatus],
  );

  React.useEffect(() => {
    if (!shouldPreventUserActions) return;
    readPendingAlerts(assignmentId, currentUserId).forEach((payload) => {
      sendPendingAlert(payload);
    });
  }, [assignmentId, currentUserId, sendPendingAlert, shouldPreventUserActions]);

  React.useEffect(
    () => () => {
      retryTimers.current.forEach((timer) => window.clearTimeout(timer));
      retryTimers.current.clear();
    },
  );

  const handleSecurityViolation = React.useCallback(
    (event: SecurityViolationEvent) => {
      const punitive = Boolean(assignmentData?.alertPolicy?.punitiveTypes?.includes(event.type));
      const eventId = punitive ? crypto.randomUUID() : undefined;

      setSecurityWarning({ eventId, event, punitive, pending: punitive });
      if (event.type === AssignmentAlertType.TypingRate) {
        setSecurityPaused(true);
      }

      if (!punitive || !eventId) return;

      const payload: RecordAssignmentAlertRequest = {
        eventId,
        type: event.type,
        occurredAt: new Date().toISOString(),
        details: event.details,
        measuredCharactersPerSecond: event.measuredCharactersPerSecond
      };

      const pending = readPendingAlerts(assignmentId, currentUserId);

      if (!pending.some((alert) => alert.eventId === eventId)) {
        writePendingAlerts(assignmentId, currentUserId, [...pending, payload]);
      }

      sendPendingAlert(payload);
    },
    [
      assignmentData?.alertPolicy?.punitiveTypes,
      assignmentId,
      currentUserId,
      sendPendingAlert
    ],
  );

  const registerTypedText = React.useCallback(
    (text: string) => {
      if (!shouldPreventUserActions || securityPaused || !text) return;

      const now = performance.now();
      const recent = typingTimestamps.current.filter((timestamp) => now - timestamp <= 1000);

      recent.push(...Array.from(text, () => now));

      typingTimestamps.current = recent;

      const limit = assignmentData?.alertPolicy?.typingCharactersPerSecondLimit ?? 20;

      if (recent.length > limit) {
        handleSecurityViolation({
          type: AssignmentAlertType.TypingRate,
          details: { measuredCharactersPerSecond: recent.length },
          measuredCharactersPerSecond: recent.length,
        });
      }
    },
    [
      assignmentData?.alertPolicy?.typingCharactersPerSecondLimit,
      handleSecurityViolation,
      securityPaused,
      shouldPreventUserActions,
    ],
  );

  const acceptSecurityAgreement = React.useCallback(() => {
    setSecurityAgreementAccepted(true);
  }, []);

  usePreventUserActions({
    enabled: shouldPreventUserActions,
    allowedDragAreaSelector: WORKSPACE_DRAG_AREA_SELECTOR,
    allowedDragMimeType: WORKSPACE_DRAG_MIME_TYPE,
    onSecurityViolation: handleSecurityViolation,
  });

  const acknowledgeWarning = () => {
    if (securityWarning?.event.type === AssignmentAlertType.TypingRate) {
      typingTimestamps.current = []
      setSecurityPaused(false)
    }
    setSecurityWarning(null);
  };

  const value: WorkspaceContextType = {
    selectedItem,
    fileTreeData: treeData,
    workerType: workerType ?? assignmentData?.workerType,
    clipboardScope,
    securityPaused,
    securityAgreementAccepted,
    registerTypedText,
    acceptSecurityAgreement,
    selectItem,
    clearSelection,
    replaceFileTree,
  };

  const statusText = securityWarning?.pending
    ? "O registro está pendente e será reenviado automaticamente com o mesmo identificador."

    : securityWarning?.status
      ? securityWarning.status.suspended
        ? `Este alerta atingiu o limite de ${securityWarning.status.limit}. A atividade foi bloqueada.`
        : `Alerta registrado: ${securityWarning.status.activeCount} de ${securityWarning.status.limit}.`

      : securityWarning?.punitive
        ? "Registrando o alerta..."
        : "A ação foi bloqueada, mas não conta para punição nesta atividade.";

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      <AlertDialog open={Boolean(securityWarning)}>
        <AlertDialogContent
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Ação não permitida</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {securityWarning ? VIOLATION_LABELS[securityWarning.event.type] : ""}
              </span>
              <span className="block font-medium text-foreground">
                {statusText}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={acknowledgeWarning}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceContext.Provider>
  );
};
