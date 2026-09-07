"use client";

import { SchedulingResponse } from "@/app/interface/scheduler-api/scheduling";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, XCircle } from "lucide-react";
import React from "react";

interface WorkspaceRunPreviewDialogProps {
  open: boolean;
  loading: boolean;
  cancelling?: boolean;
  cancelled?: boolean;
  result: SchedulingResponse | null;
  error: string | null;
  onClose: () => void | Promise<void>;
}

export function WorkspaceRunPreviewDialog({
  open,
  loading,
  cancelling = false,
  cancelled = false,
  result,
  error,
  onClose,
}: WorkspaceRunPreviewDialogProps) {
  const hasResult = Boolean(result);
  const showError = Boolean(error);
  const isBusy = loading || cancelling;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        void onClose();
      }
    },
    [onClose],
  );

  const handleClose = React.useCallback(() => {
    void onClose();
  }, [onClose]);

  const scoreValue =
    result && Number.isFinite(result.score)
      ? result.score <= 1
        ? result.score * 100
        : result.score
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[min(94vw,56rem)] max-w-[56rem] max-h-[90vh] overflow-hidden border-border bg-background text-foreground"
        onEscapeKeyDown={(event) => {
          if (isBusy) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (isBusy) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl">Pré-visualização da execução</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {cancelling
              ? "Cancelando a pré-visualização."
              : cancelled
                ? "A pré-visualização foi cancelada."
                : loading
                  ? "Executando testes sincronamente. Fechar este diálogo cancela a execução ativa."
                  : hasResult
                    ? "A pré-visualização foi concluída com sucesso."
                    : showError
                      ? "A pré-visualização falhou."
                      : "Aguardando dados da pré-visualização."}
          </DialogDescription>
        </DialogHeader>

        {isBusy && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-foreground">
              {cancelled ? (
                <XCircle className="h-4 w-4 text-foreground" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {cancelling
                ? "Cancelando execução..."
                : cancelled
                  ? "Execução cancelada."
                  : "Executando verificações..."}
            </div>
            <p className="text-sm text-muted-foreground">
              {cancelling
                ? "Aguardando o backend parar o trabalho."
                : cancelled
                  ? "Retornando ao editor."
                  : "Pressione cancelar para parar a execução atual antes de voltar ao editor."}
            </p>
          </div>
        )}

        {!loading && showError && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <XCircle className="h-4 w-4" />
              Pré-visualização falhou
            </div>
            <p>{error}</p>
          </div>
        )}

        {!loading && hasResult && result && (
          <div className="space-y-4 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                className={
                  result.isAcceptable
                    ? "bg-success text-success-foreground"
                    : "bg-destructive text-destructive-foreground"
                }
              >
                {result.isAcceptable ? "Aceito" : "Reprovado"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Nota {scoreValue.toFixed(0)}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Nota
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {result.score}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Aprovados
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {result.passes}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Reprovados
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {result.fails}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Relatório</p>
              <ScrollArea className="h-72 w-full max-w-full rounded-lg border border-border bg-background">
                <pre className="whitespace-pre-wrap break-words p-4 text-xs leading-5 text-foreground">
                  {result.report || "Nenhum relatório retornado."}
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={cancelling}>
            {loading
              ? "Cancelar execução"
              : cancelling
                ? "Cancelando..."
                : cancelled
                  ? "Cancelado"
                  : "Fechar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
