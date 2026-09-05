"use client";

import { ADMIN_ATTEMPTS_TEXT } from "@/app/admin/attempts/constants";
import { AttemptAdminService } from "@/app/integration/scheduler-api/attempt";
import type { AdminUserAttemptSummary } from "@/app/interface/scheduler-api/admin-attempt";
import { AdminUserAttemptsTable } from "@/components/attempts/admin-user-attempts-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminUserAttempts } from "@/hooks/use-admin-user-attempts";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AdminUserAttemptsDialogProps {
  attemptSummary: AdminUserAttemptSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminUserAttemptsDialog({
  attemptSummary,
  open,
  onOpenChange,
}: AdminUserAttemptsDialogProps) {
  const queryClient = useQueryClient();
  const userId = attemptSummary?.user.id;
  const assignmentId = attemptSummary?.assignment.id;
  const selectionKey =
    assignmentId && userId ? `${assignmentId}:${userId}` : null;
  const [expandedAttemptId, setExpandedAttemptId] = useState<number | null>(
    null,
  );
  const initializedSelectionRef = useRef<string | null>(null);

  const {
    data: attempts,
    isPending,
    isError,
    error,
    refetch,
  } = useAdminUserAttempts({ assignmentId, userId, enabled: open });

  useEffect(() => {
    if (!open) {
      initializedSelectionRef.current = null;
      setExpandedAttemptId(null);
      return;
    }

    if (
      selectionKey &&
      attempts?.length &&
      initializedSelectionRef.current !== selectionKey
    ) {
      initializedSelectionRef.current = selectionKey;
      setExpandedAttemptId(attempts[0].id);
    }
  }, [attempts, open, selectionKey]);

  const retryMutation = useMutation({
    mutationFn: (attemptId: number) =>
      AttemptAdminService.retryAttempt(attemptId),
    onSuccess: async () => {
      toast({
        title: ADMIN_ATTEMPTS_TEXT.retry.successTitle,
        description: ADMIN_ATTEMPTS_TEXT.retry.successDescription,
      });

      const refreshedAttempts = await refetch();
      setExpandedAttemptId(refreshedAttempts.data?.[0]?.id ?? null);
      await queryClient.invalidateQueries({ queryKey: ["adminAttempts"] });
    },
    onError: (mutationError: unknown) => {
      const description =
        mutationError instanceof Error
          ? mutationError.message
          : ADMIN_ATTEMPTS_TEXT.retry.errorFallbackDescription;

      toast({
        title: ADMIN_ATTEMPTS_TEXT.retry.errorTitle,
        description,
        variant: "destructive",
      });
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setExpandedAttemptId(null);

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-6xl overflow-y-auto border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Tentativas de {attemptSummary?.user.email}
          </DialogTitle>

          <DialogDescription className="text-muted-foreground">
            {attemptSummary?.assignment.title
              ? `${attemptSummary.assignment.title} · `
              : ""}
            {attempts?.length ?? attemptSummary?.attemptsCount ?? 0}{" "}
            tentativa(s)
          </DialogDescription>
        </DialogHeader>

        {isPending && (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando tentativas do usuário...
          </div>
        )}

        {isError && (
          <div className="space-y-3 rounded-md border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "Não foi possível carregar as tentativas do usuário."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border bg-background text-foreground hover:bg-card"
              onClick={() => refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {!isPending && !isError && attempts?.length === 0 && (
          <div className="rounded-md border border-border bg-background/70 p-8 text-center text-sm text-muted-foreground">
            Nenhuma tentativa foi encontrada para este usuário nesta atividade.
          </div>
        )}

        {!isPending && !isError && attempts && attempts.length > 0 && (
          <AdminUserAttemptsTable
            attempts={attempts}
            expandedAttemptId={expandedAttemptId}
            isRetryPending={retryMutation.isPending}
            retryingAttemptId={
              retryMutation.isPending ? retryMutation.variables : null
            }
            onToggleAttempt={(attemptId) => {
              return setExpandedAttemptId((currentAttemptId) =>
                currentAttemptId === attemptId ? null : attemptId,
              );
            }}
            onRetryAttempt={(attemptId) => retryMutation.mutate(attemptId)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
