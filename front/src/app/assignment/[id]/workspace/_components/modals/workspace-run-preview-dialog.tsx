"use client";

import type { SchedulingResponse } from "@/app/interface/scheduler-api/scheduling";
import { Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkspaceRunPreviewDialogProps {
  open: boolean;
  loading: boolean;
  cancelling?: boolean;
  cancelled?: boolean;
  result: SchedulingResponse | null;
  error: string | null;
  onClose: () => void | Promise<void>;
}

enum PreviewStatus {
  RUNNING = "running",
  CANCELLING = "cancelling",
  CANCELLED = "cancelled",
  ERROR = "error",
  SUCCESS = "success",
  IDLE = "idle"
}

interface PreviewStatusInput {
  loading: boolean;
  cancelling: boolean;
  cancelled: boolean;
  hasResult: boolean;
  hasError: boolean;
}

interface PreviewProgressContent {
  message: string;
  description: string;
}

interface PreviewMetricProps {
  label: string;
  value: string | number;
}

function getPreviewStatus({
  loading,
  cancelling,
  cancelled,
  hasResult,
  hasError,
}: PreviewStatusInput): PreviewStatus {
  if (cancelling) return PreviewStatus.CANCELLING;
  if (cancelled) return PreviewStatus.CANCELLED;
  if (loading) return PreviewStatus.RUNNING;
  if (hasError) return PreviewStatus.ERROR;
  if (hasResult) return PreviewStatus.SUCCESS;

  return PreviewStatus.IDLE;
}

function getScoreValue(score?: number): number {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return 0;
  }

  return score <= 1 ? score * 100 : score;
}

function PreviewMetric({ label, value }: PreviewMetricProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

const descriptionByStatus: Record<PreviewStatus, string> = {
  [PreviewStatus.RUNNING]: "Executando testes sincronamente. Fechar este diálogo cancela a execução ativa.",
  [PreviewStatus.CANCELLING]: "Cancelando a pré-visualização.",
  [PreviewStatus.CANCELLED]: "A pré-visualização foi cancelada.",
  [PreviewStatus.ERROR]: "A pré-visualização falhou.",
  [PreviewStatus.SUCCESS]: "A pré-visualização foi concluída com sucesso.",
  [PreviewStatus.IDLE]: "Aguardando dados da pré-visualização."
};

const progressContentByStatus: Partial<
  Record<PreviewStatus, PreviewProgressContent>
> = {
  [PreviewStatus.RUNNING]: {
    message: "Executando verificações...",
    description: "Pressione cancelar para parar a execução atual antes de voltar ao editor."
  },
  [PreviewStatus.CANCELLING]: {
    message: "Cancelando execução...",
    description: "Aguardando o backend parar o trabalho."
  }
};

const closeButtonLabelByStatus: Record<PreviewStatus, string> = {
  [PreviewStatus.RUNNING]: "Cancelar execução",
  [PreviewStatus.CANCELLING]: "Cancelando...",
  [PreviewStatus.CANCELLED]: "Fechar",
  [PreviewStatus.ERROR]: "Fechar",
  [PreviewStatus.SUCCESS]: "Fechar",
  [PreviewStatus.IDLE]: "Fechar"
};

export function WorkspaceRunPreviewDialog({
  open,
  loading,
  cancelling = false,
  cancelled = false,
  result,
  error,
  onClose
}: WorkspaceRunPreviewDialogProps) {
  const hasResult = Boolean(result);
  const hasError = Boolean(error);

  const status = getPreviewStatus({
    loading,
    cancelling,
    cancelled,
    hasResult,
    hasError,
  });

  const progressContent = progressContentByStatus[status];
  const isBusy = Boolean(progressContent);
  const scoreValue = getScoreValue(result?.score);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-[min(94vw,56rem)] max-w-[56rem] overflow-hidden border-border bg-background text-foreground"
        onEscapeKeyDown={(event) => {
          if (isBusy) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isBusy) event.preventDefault();
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl">
            Pré-visualização da execução
          </DialogTitle>

          <DialogDescription className="text-muted-foreground">
            {descriptionByStatus[status]}
          </DialogDescription>
        </DialogHeader>

        {progressContent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Loader2 className="size-4 animate-spin" />
              {progressContent.message}
            </div>

            <p className="text-sm text-muted-foreground">
              {progressContent.description}
            </p>
          </div>
        )}

        {status === PreviewStatus.ERROR && error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <XCircle className="size-4" />
              Pré-visualização falhou
            </div>

            <p>{error}</p>
          </div>
        )}

        {status === PreviewStatus.SUCCESS && result && (
          <div className="min-w-0 space-y-4">
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
              <PreviewMetric label="Nota" value={scoreValue.toFixed(0)} />
              <PreviewMetric label="Aprovados" value={result.passes} />
              <PreviewMetric label="Reprovados" value={result.fails} />
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

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={status === PreviewStatus.CANCELLING}
          >
            {closeButtonLabelByStatus[status]}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}