"use client";

import { AxiosError } from "axios";
import { CheckCircle2, Loader2, Play, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnswerKeyTestResult } from "@/hooks/use-answer-key-test";

interface AnswerKeyTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  data?: AnswerKeyTestResult;
  error: unknown;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.message ??
      error.message ??
      "Erro de rede ao chamar o backend."
    );
  }

  if (error instanceof Error) return error.message;
  return "Erro no gabarito";
}

export function AnswerKeyTestDialog({
  open,
  onOpenChange,
  isPending,
  data,
  error,
}: AnswerKeyTestDialogProps) {
  const hasResult = Boolean(data);
  const hasError = Boolean(error);
  const total = (data?.passes ?? 0) + (data?.failures ?? 0);
  const score = total === 0 ? 0 : (data?.passes ?? 0) / total;
  const isAcceptable = hasResult && score >= 0.7;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden bg-slate-950 text-slate-100"
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Execução do gabarito
          </DialogTitle>
          <DialogDescription>
            Os templates da atividade serão executados contra o conteúdo atual
            do gabarito. Nada será salvo.
          </DialogDescription>
        </DialogHeader>

        {isPending && (
          <div className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Executando os templates da atividade...
          </div>
        )}

        {!isPending && hasError && (
          <Card className="border-red-700 bg-red-950/40">
            <CardContent className="space-y-2 p-4 text-sm text-red-200">
              <p className="flex items-center gap-2 font-semibold">
                <XCircle className="h-4 w-4" />
                Falha ao executar o gabarito.
              </p>
              <p>{getErrorMessage(error)}</p>
            </CardContent>
          </Card>
        )}

        {!isPending && hasResult && data && (
          <div className="space-y-4 min-w-0">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <ResultStat label="Passaram" value={data.passes} tone="ok" />
              <ResultStat label="Falharam" value={data.failures} tone="bad" />
              <ResultStat
                label="Score"
                value={`${(score * 100).toFixed(0)}%`}
                tone={isAcceptable ? "ok" : "bad"}
              />
              <ResultStat
                label="Templates"
                value={data.templateCount}
                tone="ok"
              />
              <Card>
                <CardContent className="flex h-full items-center justify-center gap-2 p-3 text-center text-sm font-medium">
                  {isAcceptable ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Aceitável
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      Reprovado
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-200">Log completo</p>
              <ScrollArea className="h-72 rounded-md border border-slate-800 bg-slate-900">
                <pre className="whitespace-pre-wrap break-words p-4 text-xs leading-5 text-slate-300">
                  {data.completeTrace || "(sem saída)"}
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "ok" | "bad";
}) {
  const color = tone === "ok" ? "text-emerald-500" : "text-red-500";

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-3 text-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
      </CardContent>
    </Card>
  );
}
