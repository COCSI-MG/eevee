"use client";

import { AdminUserAttemptSummary } from "@/app/interface/scheduler-api/admin-attempt";
import {
  formatAdminAttemptScore,
  getAdminAttemptStatusBadge,
} from "@/components/attempts/admin-attempt-presentation";
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
import { Eye } from "lucide-react";

interface AdminAttemptsTableProps {
  attempts: AdminUserAttemptSummary[];
  page: number;
  total: number;
  totalPages: number;
  pageSize: number;
  onViewAttempts: (attempt: AdminUserAttemptSummary) => void;
  onPageChange: (page: number) => void;
}

export default function AdminAttemptsTable({
  attempts,
  page,
  total,
  totalPages,
  pageSize,
  onViewAttempts,
  onPageChange,
}: AdminAttemptsTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-b from-background to-background p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Histórico de tentativas
        </h2>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-background/80 hover:bg-background/80">
              <TableHead className="text-foreground">Usuário</TableHead>
              <TableHead className="text-foreground">Atividade</TableHead>
              <TableHead className="text-foreground">Último status</TableHead>
              <TableHead className="text-foreground">Última nota</TableHead>
              <TableHead className="text-foreground">
                Última tentativa
              </TableHead>
              <TableHead className="text-foreground">Tentativas</TableHead>
              <TableHead className="text-foreground">Última execução</TableHead>
              <TableHead className="text-right text-foreground">Ação</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {attempts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nenhuma tentativa encontrada para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}

            {attempts.map((attempt) => (
              <TableRow
                key={`${attempt.user.id}-${attempt.assignment.id}`}
                className="hover:bg-background/60"
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {attempt.user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ID {attempt.user.id}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">
                  {attempt.assignment.title}
                </TableCell>
                <TableCell>
                  {getAdminAttemptStatusBadge(attempt.lastAttempt.status)}
                </TableCell>
                <TableCell className="text-foreground">
                  {formatAdminAttemptScore(attempt.lastAttempt.score)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2 text-foreground">
                    <span>#{attempt.lastAttempt.attempt}</span>
                    <Badge variant="secondary">Mais recente</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">
                  {attempt.attemptsCount}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(attempt.lastAttempt.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      className="border-border bg-background text-foreground hover:bg-card"
                      onClick={() => onViewAttempts(attempt)}
                    >
                      <Eye className="h-4 w-4" />
                      Ver tentativas
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        itemLabel={{ singular: "resultado", plural: "resultados" }}
        className="mt-5 text-foreground [&_p]:text-muted-foreground [&_span]:border-border [&_span]:bg-background"
      />
    </div>
  );
}
