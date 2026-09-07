"use client";

import { AdminAttemptListItem } from "@/app/interface/scheduler-api/admin-attempt";
import { AdminAttemptExpandedRow } from "@/components/attempts/admin-attempt-expanded-row";
import Pagination from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/utils/date";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, RefreshCcw } from "lucide-react";
import { Fragment } from "react";

interface AdminAttemptsTableProps {
  attempts: AdminAttemptListItem[];
  page: number;
  total: number;
  totalPages: number;
  pageSize: number;
  expandedAttemptIds: Set<number>;
  retryingAttemptId: number | null;
  onToggleExpand: (attemptId: number) => void;
  onRetry: (attemptId: number) => void;
  onPageChange: (page: number) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge variant="outline" className="border-success text-success">
          Sucesso
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="bg-destructive text-destructive-foreground">
          Falha
        </Badge>
      );
    case "running":
      return (
        <Badge className="bg-warning text-warning-foreground animate-pulse">Executando</Badge>
      );
    case "pending":
      return <Badge className="bg-primary/30 text-foreground">Pendente</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const formatScore = (score: number) => {
  const normalized = score <= 1 ? score * 100 : score;
  return `${Math.round(normalized)}/100`;
};

export default function AdminAttemptsTable({
  attempts,
  page,
  total,
  totalPages,
  pageSize,
  expandedAttemptIds,
  retryingAttemptId,
  onToggleExpand,
  onRetry,
  onPageChange,
}: AdminAttemptsTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-b from-background to-background p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Histórico de tentativas</h2>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-background/80 hover:bg-background/80">
              <TableHead className="text-foreground">Usuário</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground">Nota</TableHead>
              <TableHead className="text-foreground">Tentativa</TableHead>
              <TableHead className="text-foreground">Data/Hora</TableHead>
              <TableHead className="text-right text-foreground">Ação</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {attempts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhuma tentativa encontrada para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}

            {attempts.map((attempt) => {
              const isExpanded = expandedAttemptIds.has(attempt.id);

              return (
                <Fragment key={attempt.id}>
                  <TableRow className="hover:bg-background/60">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{attempt.user.email}</span>
                        <span className="text-xs text-muted-foreground">ID {attempt.user.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(attempt.status)}</TableCell>
                    <TableCell className="text-foreground">{formatScore(attempt.score)}</TableCell>
                    <TableCell className="text-foreground">#{attempt.attempt}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(attempt.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="border-border bg-background text-foreground hover:bg-card"
                          onClick={() => onToggleExpand(attempt.id)}
                        >
                          {isExpanded ? "Ver menos" : "Ver mais"}
                        </Button>
                        <Button
                          variant="outline"
                          className="border-primary bg-primary/10 text-primary hover:bg-primary/20"
                          disabled={retryingAttemptId === attempt.id}
                          onClick={() => onRetry(attempt.id)}
                        >
                          {retryingAttemptId === attempt.id ? (
                            <RefreshCcw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          Reexecutar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-background/70">
                      <TableCell colSpan={6}>
                        <AdminAttemptExpandedRow attemptId={attempt.id} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        itemLabel={{ singular: "tentativa", plural: "tentativas" }}
        className="mt-5 text-foreground [&_p]:text-muted-foreground [&_span]:border-border [&_span]:bg-background"
      />
    </div>
  );
}
