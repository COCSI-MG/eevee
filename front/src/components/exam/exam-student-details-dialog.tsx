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
    return { label: 'Pendente', className: 'border-warning text-warning', Icon: Clock };
  }

  if (assignment.isAcceptable) {
    return { label: 'Acertou', className: 'border-success text-success', Icon: CheckCircle2 };
  }
  return { label: 'Errou', className: 'border-destructive text-destructive', Icon: XCircle };
};

const getScoreColor = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return 'text-muted-foreground';
  if (score >= 1) return 'text-success';

  return 'text-destructive';
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
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {student.name || `Aluno #${student.userId}`}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {student.email}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-1.5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-foreground">
              {student.approvedAssignments}/{student.totalAssignments} aprovadas
            </span>
            <span className="text-muted-foreground">({approvedPercent}%)</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-1.5">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-foreground">
              Nota: {student.examGrade.toFixed(2)}/{student.maxExamGrade.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-b from-background to-background p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Atividades da prova
          </h2>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-background/80 hover:bg-background/80">
                  <TableHead className="text-foreground">Atividade</TableHead>
                  <TableHead className="text-foreground">Peso</TableHead>
                  <TableHead className="text-foreground">Tentativas</TableHead>
                  <TableHead className="text-foreground">Última nota</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="w-[100px] text-right text-foreground">Detalhes</TableHead>
                  <TableHead className="w-[120px] text-right text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.assignments.map((a) => {
                  const isExpanded = expandedAssignmentIds?.has(a.assignmentId) ?? false;

                  return (
                    <Fragment key={a.assignmentId}>
                      <TableRow className="hover:bg-background/60">
                        <TableCell className="font-medium text-foreground">
                          {a.title}
                        </TableCell>
                        <TableCell className="tabular-nums text-foreground">
                          {a.weight.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-foreground">
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
                              className="border-border bg-background text-foreground hover:bg-card"
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
                                className="border-primary bg-primary/10 text-primary hover:bg-primary/20"
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
                        <TableRow className="bg-background/70">
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
