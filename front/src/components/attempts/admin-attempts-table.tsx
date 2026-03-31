"use client";

import { AdminAttempt } from "@/app/interface/scheduler-api/admin-attempt";
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
import { ChevronLeft, ChevronRight, Play, RefreshCcw } from "lucide-react";
import { Fragment } from "react";

interface AdminAttemptsTableProps {
  attempts: AdminAttempt[];
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
        <Badge variant="outline" className="border-emerald-500 text-emerald-300">
          Success
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="bg-red-700 text-white">
          Failure
        </Badge>
      );
    case "running":
      return (
        <Badge className="bg-amber-600 text-white animate-pulse">Running</Badge>
      );
    case "pending":
      return <Badge className="bg-slate-600 text-white">Pending</Badge>;
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
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Historico de tentativas</h2>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-900/80 hover:bg-slate-900/80">
              <TableHead className="text-slate-300">Usuario</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300">Score</TableHead>
              <TableHead className="text-slate-300">Tentativa</TableHead>
              <TableHead className="text-slate-300">Timestamp</TableHead>
              <TableHead className="text-right text-slate-300">Acao</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {attempts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-400">
                  Nenhuma tentativa encontrada para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}

            {attempts.map((attempt) => {
              const isExpanded = expandedAttemptIds.has(attempt.id);
              const fileEntries = Object.entries(attempt.receivedWork ?? {});

              return (
                <Fragment key={attempt.id}>
                  <TableRow className="hover:bg-slate-900/60">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-100">{attempt.user.email}</span>
                        <span className="text-xs text-slate-400">ID {attempt.user.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(attempt.status)}</TableCell>
                    <TableCell className="text-slate-200">{formatScore(attempt.score)}</TableCell>
                    <TableCell className="text-slate-300">#{attempt.attempt}</TableCell>
                    <TableCell className="text-slate-400">
                      {new Date(attempt.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                          onClick={() => onToggleExpand(attempt.id)}
                        >
                          {isExpanded ? "Ver menos" : "Ver mais"}
                        </Button>
                        <Button
                          variant="outline"
                          className="border-blue-700 bg-blue-900/40 text-blue-200 hover:bg-blue-800/50"
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
                    <TableRow className="bg-slate-950/70">
                      <TableCell colSpan={6}>
                        <div className="space-y-4 py-2">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Report
                            </p>
                            <pre className="max-h-64 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-200 whitespace-pre-wrap">
                              {attempt.report || "Sem report para esta tentativa."}
                            </pre>
                          </div>

                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Arquivos enviados
                            </p>
                            {fileEntries.length === 0 ? (
                              <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
                                Esta tentativa nao possui arquivos armazenados.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {fileEntries.map(([filePath, content]) => (
                                  <div
                                    key={`${attempt.id}-${filePath}`}
                                    className="rounded-md border border-slate-800 bg-slate-950"
                                  >
                                    <div className="border-b border-slate-800 px-3 py-2 text-xs font-medium text-slate-300">
                                      {filePath}
                                    </div>
                                    <pre className="max-h-56 overflow-auto p-3 text-xs text-slate-200 whitespace-pre-wrap">
                                      {content}
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          Mostrando {startIndex}-{endIndex} de {total} tentativas
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100">
            {page} / {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
