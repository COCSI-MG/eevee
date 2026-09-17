"use client";

import { AdminAttemptDetails } from "@/components/attempts/admin-attempt-details";
import { Button } from "@/components/ui/button";
import { useAdminAttemptDetail } from "@/hooks/use-admin-attempt-detail";
import { Loader2 } from "lucide-react";

interface AdminAttemptExpandedRowProps {
  attemptId: number;
}

export function AdminAttemptExpandedRow({
  attemptId,
}: AdminAttemptExpandedRowProps) {
  const { data, isPending, isError, error, refetch } = useAdminAttemptDetail(
    attemptId,
    true,
  );

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
      error instanceof Error
        ? error.message
        : "Não foi possível carregar os detalhes.";
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

  return <AdminAttemptDetails attempt={data} />;
}
