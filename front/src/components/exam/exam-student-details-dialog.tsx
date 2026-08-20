"use client";

import { ExamStudentGrades } from "@/app/interface/scheduler-api/exam-student-grades";
import { AdminAttemptExpandedRow } from "@/components/attempts/admin-attempt-expanded-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, CheckCircle2, Clock, Play, RefreshCcw, XCircle } from "lucide-react";
import { Fragment } from "react";

const getAttemptStatusInfo = (assignment: { isAcceptable: boolean; lastAttempt: { status?: string } | null }) => {

  if (!assignment.lastAttempt) {
    return { label: 'Pendente', className: 'border-amber-500/40 text-amber-300', Icon: Clock };
  }

  if (assignment.isAcceptable) {
    return { label: 'Acertou', className: 'border-emerald-500/40 text-emerald-300', Icon: CheckCircle2 };
  }
  return { label: 'Errou', className: 'border-rose-500/40 text-rose-300', Icon: XCircle };
};

const getScoreColor = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return 'text-slate-500';
  if (score >= 1) return 'text-emerald-300';

  return 'text-rose-300';
};

interface ExamStudentDetailsDialogProps {
  student: ExamStudentGrades | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: (attemptId: number) => void;
  retryingAssignmentId?: number | null;
  expandedAssignmentIds?: Set<number>;
  onToggleExpand?: (assignmentId: number) => void;
}

export default function ExamStudentDetailsDialog({
  student,
  open,
  onOpenChange,
  onRetry,
  retryingAssignmentId,
  expandedAssignmentIds,
  onToggleExpand,
}: ExamStudentDetailsDialogProps) {
  if (!student) return null;

  const approvedPercent =
    student.totalAssignments > 0
      ? Math.round((student.approvedAssignments / student.totalAssignments) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto border-slate-800 bg-slate-950">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            {student.name || `Aluno #${student.userId}`}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {student.email}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-300">
              {student.approvedAssignments}/{student.totalAssignments} aprovadas
            </span>
            <span className="text-slate-500">({approvedPercent}%)</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-3 py-1.5">
            <BookOpen className="h-4 w-4 text-blue-400" />
            <span className="text-slate-300">
              Nota: {student.examGrade.toFixed(2)}/{student.maxExamGrade.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Atividades da prova
          </h2>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-900/80 hover:bg-slate-900/80">
                  <TableHead className="text-slate-300">Atividade</TableHead>
                  <TableHead className="text-slate-300">Peso</TableHead>
                  <TableHead className="text-slate-300">Tentativas</TableHead>
                  <TableHead className="text-slate-300">Última nota</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="w-[100px] text-right text-slate-300">Detalhes</TableHead>
                  <TableHead className="w-[120px] text-right text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.assignments.map((a) => {
                  const isExpanded = expandedAssignmentIds?.has(a.assignmentId) ?? false;

                  return (
                    <Fragment key={a.assignmentId}>
                      <TableRow className="hover:bg-slate-900/60">
                        <TableCell className="font-medium text-slate-100">
                          {a.title}
                        </TableCell>
                        <TableCell className="tabular-nums text-slate-300">
                          {a.weight.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {a.attemptsCount}
                        </TableCell>
                        <TableCell className={`tabular-nums ${getScoreColor(a.lastAttempt?.score)}`}>
                          {a.lastAttempt ? a.lastAttempt.score.toFixed(2) : "—"}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const { label, className, Icon } = getAttemptStatusInfo(a);
                            return (
                              <Badge variant="outline" className={className}>
                                <Icon className="h-3 w-3 mr-1" />
                                {label}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                              disabled={!a.lastAttempt || !onToggleExpand}
                              onClick={() => onToggleExpand?.(a.assignmentId)}
                            >
                              {isExpanded ? "Ver menos" : "Ver mais"}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {a.lastAttempt && onRetry ? (
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-700 bg-blue-900/40 text-blue-200 hover:bg-blue-800/50"
                                disabled={retryingAssignmentId === a.lastAttempt.id}
                                onClick={() => onRetry(a.lastAttempt!.id)}
                              >
                                {retryingAssignmentId === a.lastAttempt.id ? (
                                  <RefreshCcw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                                Reexecutar
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>

                      {isExpanded && a.lastAttempt && (
                        <TableRow className="bg-slate-950/70">
                          <TableCell colSpan={7}>
                            <AdminAttemptExpandedRow attemptId={a.lastAttempt.id} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
