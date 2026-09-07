"use client";

import { useAdminAttemptDetail } from "@/hooks/use-admin-attempt-detail";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AdminAttemptExpandedRowProps {
  attemptId: number;
}

export function AdminAttemptExpandedRow({ attemptId }: AdminAttemptExpandedRowProps) {
  const { data, isPending, isError, error, refetch } = useAdminAttemptDetail(attemptId, true);

  if (isPending) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando detalhes da tentativa...
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : "Não foi possível carregar os detalhes.";
    return (
      <div className="space-y-3 py-2">
        <p className="text-sm text-destructive">{message}</p>
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
    );
  }

  if (!data) {
    return null;
  }

  const fileEntries = Object.entries(data.receivedWork ?? {});

  return (
    <div className="space-y-4 py-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Relatório</p>
        <pre className="max-h-64 overflow-auto rounded-md bg-background p-3 text-xs text-foreground whitespace-pre-wrap">
          {data.report || "Sem report para esta tentativa."}
        </pre>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Arquivos enviados
        </p>
        {fileEntries.length === 0 ? (
          <div className="rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
            Esta tentativa não possui arquivos armazenados.
          </div>
        ) : (
          <div className="space-y-3">
            {fileEntries.map(([filePath, content]) => (
              <div
                key={`${attemptId}-${filePath}`}
                className="rounded-md border border-border bg-background"
              >
                <div className="border-b border-border px-3 py-2 text-xs font-medium text-foreground">
                  {filePath}
                </div>
                <pre className="max-h-56 overflow-auto p-3 text-xs text-foreground whitespace-pre-wrap">
                  {content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
