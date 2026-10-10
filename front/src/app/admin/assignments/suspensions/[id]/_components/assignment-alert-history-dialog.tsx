"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AssignmentAlertService } from "@/app/integration/scheduler-api/assignment-alert";
import {
  type AssignmentAlertUserSummary,
  type AssignmentUserAlert,
} from "@/app/interface/scheduler-api/assignment-alert";
import {
  ALERT_LABELS,
  HISTORY_STATUS,
  type HistoryStatus,
} from "@/app/admin/assignments/suspensions/constants";
import { AssignmentAlertHistoryTable } from "@/app/admin/assignments/suspensions/[id]/_components/assignment-alert-history-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/date";

interface AssignmentAlertHistoryDialogProps {
  assignmentId: number;
  selectedUser: AssignmentAlertUserSummary | null;
  onClose: () => void;
}

export function AssignmentAlertHistoryDialog({
  assignmentId,
  selectedUser,
  onClose,
}: AssignmentAlertHistoryDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>(HISTORY_STATUS.ACTIVE);
  const [alertToArchive, setAlertToArchive] = useState<AssignmentUserAlert | null>(null);

  const historyQuery = useQuery({
    queryKey: [
      "assignment-alert-history",
      assignmentId,
      selectedUser?.userId,
      historyStatus
    ],
    queryFn: () =>
      AssignmentAlertService.listUserHistory(
        assignmentId,
        selectedUser!.userId,
        {
          page: 1,
          pageSize: 100,
          status: historyStatus,
        }
      ),
    enabled: Boolean(selectedUser)
  });

  const archiveMutation = useMutation({
    mutationFn: ({
      userId,
      alert
    }: { userId: number, alert: AssignmentUserAlert}) => AssignmentAlertService.archiveAlert(assignmentId, userId, alert.id),
    onSuccess: async (result, { alert }) => {
      setAlertToArchive(null);

      const activeLabel = result.activeCount === 1 ? "1 alerta ativo permanece" : `${result.activeCount} alertas ativos permanecem`;

      toast({
        title: "Alerta arquivado",
        description: `${ALERT_LABELS[alert.type]} de ${formatDate(alert.occurredAt ?? alert.createdAt)}. ${activeLabel}; o aluno ${
          result.suspended ? "continua bloqueado" : "está liberado"
        }.`
      });

      await queryClient.invalidateQueries({queryKey: ["assignment-alert-users", assignmentId]});

      await queryClient.invalidateQueries({queryKey: ["assignment-alert-history", assignmentId]});
    },
    onError: () => {
      toast({
        title: "Não foi possível arquivar o alerta",
        description: "O registro continua ativo. Tente novamente.",
        variant: "destructive"
      });
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (!open && !archiveMutation.isPending) {
      setAlertToArchive(null);
      setHistoryStatus(HISTORY_STATUS.ACTIVE);
      onClose();
    }
  };

  const RenderHistoryContent = () => {
    if (historyQuery.isLoading) {
      return <p className="text-sm text-muted-foreground">Carregando...</p>;
    }

    if (historyQuery.isError) {
      return (
        <p className="text-sm text-destructive">
          Não foi possível carregar este histórico.
        </p>
      );
    }

    const alerts = historyQuery.data?.data ?? [];

    if (alerts.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {historyStatus === HISTORY_STATUS.ACTIVE ? "Nenhum alerta ativo para este aluno." : "Nenhum alerta arquivado para este aluno."}
        </p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <AssignmentAlertHistoryTable
          alerts={alerts}
          isArchiving={archiveMutation.isPending}
          onArchive={setAlertToArchive}
        />
      </div>
    );
  };

  return (
    <Dialog open={Boolean(selectedUser)} onOpenChange={handleOpenChange}>
      <DialogContent
        className={alertToArchive ? "max-w-lg" : "max-h-[80vh] max-w-5xl overflow-y-auto"}
        onEscapeKeyDown={(event) => {
          if (archiveMutation.isPending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (archiveMutation.isPending) event.preventDefault();
        }}
      >
        {alertToArchive ? (
          <>
            <DialogHeader>

              <DialogTitle>Arquivar este alerta?</DialogTitle>
              <DialogDescription>
                {
                  `${ALERT_LABELS[alertToArchive.type]} ocorrido em ${formatDate(alertToArchive.occurredAt ?? alertToArchive.createdAt)}
                  . O registro deixará de contar para o bloqueio, mas continuará visível em Arquivados.`
                }
              </DialogDescription>

            </DialogHeader>
            <DialogFooter>
              <Button
                autoFocus
                disabled={archiveMutation.isPending}
                onClick={() => setAlertToArchive(null)}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                disabled={archiveMutation.isPending || !selectedUser}
                onClick={() => {
                  if (!selectedUser) return;

                  archiveMutation.mutate({userId: selectedUser.userId, alert: alertToArchive});
                }}
                type="button"
              >
                {archiveMutation.isPending ? "Arquivando..." : "Arquivar alerta"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>

              <DialogTitle>Histórico de {selectedUser?.name}</DialogTitle>
              <DialogDescription>
                Consulte as ocorrências ativas ou os registros arquivados para auditoria.
              </DialogDescription>

            </DialogHeader>
            <div
              aria-label="Filtrar histórico por estado"
              className="flex w-fit gap-1 rounded-md border p-1"
              role="group"
            >
              <Button
                aria-pressed={historyStatus === HISTORY_STATUS.ACTIVE}
                onClick={() => setHistoryStatus(HISTORY_STATUS.ACTIVE)}
                size="sm"
                type="button"
                variant={historyStatus === HISTORY_STATUS.ACTIVE ? "default" : "ghost"}
              >
                Ativos
              </Button>

              <Button
                aria-pressed={historyStatus === HISTORY_STATUS.ARCHIVED}
                onClick={() => setHistoryStatus(HISTORY_STATUS.ARCHIVED)}
                size="sm"
                type="button"
                variant={historyStatus === HISTORY_STATUS.ARCHIVED? "default" : "ghost"}
              >
                Arquivados
              </Button>
            </div>

            <RenderHistoryContent />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
