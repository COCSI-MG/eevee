"use client";

import type { AdminAttemptDetail } from "@/app/interface/scheduler-api/admin-attempt";
import { AdminAttemptDetails } from "@/components/attempts/admin-attempt-details";
import {
  formatAdminAttemptScore,
  getAdminAttemptStatusBadge,
} from "@/components/attempts/admin-attempt-presentation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/utils/date";
import { Play, RefreshCcw } from "lucide-react";
import { Fragment } from "react";

interface AdminUserAttemptsTableProps {
  attempts: AdminAttemptDetail[];
  expandedAttemptId: number | null;
  isRetryPending: boolean;
  retryingAttemptId: number | null;
  onToggleAttempt: (attemptId: number) => void;
  onRetryAttempt: (attemptId: number) => void;
}

export function AdminUserAttemptsTable({
  attempts,
  expandedAttemptId,
  isRetryPending,
  retryingAttemptId,
  onToggleAttempt,
  onRetryAttempt,
}: AdminUserAttemptsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-background/80 hover:bg-background/80">
            <TableHead className="text-foreground">Tentativa</TableHead>
            <TableHead className="text-foreground">Status</TableHead>
            <TableHead className="text-foreground">Nota</TableHead>
            <TableHead className="text-foreground">Testes</TableHead>
            <TableHead className="text-foreground">Data/Hora</TableHead>
            <TableHead className="text-right text-foreground">
              Detalhes
            </TableHead>
            <TableHead className="text-right text-foreground">Ação</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {attempts.map((attempt, index) => {
            const isLatest = index === 0;
            const isExpanded = expandedAttemptId === attempt.id;
            const isRetrying = retryingAttemptId === attempt.id;

            return (
              <Fragment key={attempt.id}>
                <TableRow
                  className={
                    isLatest
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-background/60"
                  }
                >
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2 text-foreground">
                      <span>#{attempt.attempt}</span>
                      {isLatest && (
                        <Badge variant="secondary">Mais recente</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getAdminAttemptStatusBadge(attempt.status)}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatAdminAttemptScore(attempt.score)}
                  </TableCell>
                  <TableCell className="text-foreground">
                    Passou: {attempt.passes} · Falhou: {attempt.fails}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(attempt.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-border bg-background text-foreground hover:bg-card"
                        aria-expanded={isExpanded}
                        onClick={() => onToggleAttempt(attempt.id)}
                      >
                        {isExpanded ? "Ver menos" : "Ver mais"}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-primary bg-primary/10 text-primary hover:bg-primary/20"
                        disabled={isRetryPending}
                        onClick={() => onRetryAttempt(attempt.id)}
                      >
                        {isRetrying ? (
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
                    <TableCell colSpan={7}>
                      <AdminAttemptDetails attempt={attempt} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
