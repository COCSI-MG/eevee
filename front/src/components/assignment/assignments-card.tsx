import { BookOpenCheck, CalendarClock, Code, CodeSquare } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useRouter } from "next/navigation";
import { Route } from "@/app/routes";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { formatScorePercentage } from "@/utils/score";
import {
  AttemptStatus,
  PROCESSING_ATTEMPT_STATUSES,
} from "@/app/interface/scheduler-api/assignment-attempt";
import {
  earliestDate,
  formatDateTime,
  isDeadlinePassed,
} from "@/utils/date";

interface AssignmentsCardProps {
  data: Assignment[];
}

const BADGE_COMPACT_CLASS = "text-[10px] px-2 py-0.5";

export default function AssignmentsCard({ data }: AssignmentsCardProps) {
  const { user } = useAuthContext();
  const userId = user?.userId;
  const { push } = useRouter();
  const [selectedDescriptionModal, setSelectedDescriptionModal] = useState<
    number | null
  >(null);

  const shouldShowExpandButton = (description: string | undefined) => {
    if (!description) return false;
    return description.length > 80;
  };

  const handleTry = (id: number) => {
    push(`/${Route.Assignment}/${id}/${Route.Workspace}`);
  };

  const canAccessAssignment = (assignment: Assignment) => {
    if (!userId) {
      return false;
    }

    if ((assignment.suspensions?.length ?? 0) === 0) {
      return true;
    }

    return !assignment.suspensions?.some(
      (suspension) => suspension.userId === userId,
    );
  };

  const getLastAttempt = (assignment: Assignment) => {
    if (!assignment.assignmentAttempts?.length) {
      return null;
    }
    return [...assignment.assignmentAttempts].sort(
      (a, b) => b.attempt - a.attempt,
    )[0];
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((assignment) => {
        const lastAttempt = getLastAttempt(assignment);
        const lastAttemptStatus = lastAttempt?.status;
        const canAccess = canAccessAssignment(assignment);

        const isProcessing = lastAttemptStatus
          ? PROCESSING_ATTEMPT_STATUSES.has(lastAttemptStatus)
          : false;
        const canViewAnswerKey =
          Boolean(assignment.answerKeyId) && assignment.answerKeyVisible;
        const effectiveDueDate = earliestDate(
          assignment.dueDate,
          assignment.examAssignment?.exam?.dueDate,
        );
        const deadlinePassed = !user?.isAdmin && isDeadlinePassed(effectiveDueDate);

        return (
          <Card
            key={assignment.id}
            className={cn(
              "overflow-hidden hover:shadow-md transition-shadow",
              {
                "opacity-50": !canAccess,
              },
              {
                "border border-success": isProcessing,
              },
              {
                "border border-destructive": lastAttemptStatus === AttemptStatus.Failed,
              },
              {
                "border border-warning": lastAttemptStatus === AttemptStatus.Completed,
              },
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-2 text-foreground">
                <span className="min-w-0 flex-1 break-words">
                  {assignment.title}
                </span>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  {assignment.score != null && (
                    <Badge
                      className={cn(
                        BADGE_COMPACT_CLASS,
                        "bg-primary text-primary-foreground",
                      )}
                    >
                      Peso: {assignment.score} pts
                    </Badge>
                  )}

                  {!canAccess && (
                    <Badge
                      variant={"destructive"}
                      className={cn(
                        BADGE_COMPACT_CLASS,
                        "bg-destructive/10 text-destructive",
                      )}
                    >
                      Tarefa suspensa por quebra de conduta
                    </Badge>
                  )}

                  {lastAttemptStatus === AttemptStatus.Failed && (
                    <Badge
                      className={cn(
                        BADGE_COMPACT_CLASS,
                        "bg-destructive/10 text-destructive animate-pulse",
                      )}
                    >
                      Tentativa com falha
                    </Badge>
                  )}

                  {isProcessing && (
                    <Badge
                      className={cn(
                        BADGE_COMPACT_CLASS,
                        "bg-success text-success-foreground animate-pulse",
                      )}
                    >
                      Em execução
                    </Badge>
                  )}

                  {lastAttemptStatus === AttemptStatus.Completed && (
                    <Badge
                      className={cn(
                        BADGE_COMPACT_CLASS,
                        "bg-warning text-warning-foreground animate-pulse",
                      )}
                    >
                      Resultados disponíveis
                    </Badge>
                  )}

                  {lastAttemptStatus === AttemptStatus.Completed &&
                    lastAttempt?.score != null && (
                      <Badge
                        className={cn(
                          BADGE_COMPACT_CLASS,
                          lastAttempt.isAcceptable
                            ? "bg-success text-success-foreground"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        Acerto: {formatScorePercentage(lastAttempt.score)}
                      </Badge>
                    )}

                  {deadlinePassed && (
                    <Badge
                      variant="destructive"
                      className={BADGE_COMPACT_CLASS}
                    >
                      Prazo encerrado
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                  <CardDescription className="text-muted-foreground line-clamp-2">
                    {assignment.description}
                  </CardDescription>

                  {shouldShowExpandButton(assignment.description) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary h-auto p-0 w-fit"
                      onClick={() => setSelectedDescriptionModal(assignment.id)}
                    >
                      Ver mais
                    </Button>
                  )}

                  {(assignment.startDate || effectiveDueDate) && (
                    <div className="space-y-1 text-sm text-slate-400">
                      {assignment.startDate && (
                        <p className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4" />
                          Início: {formatDateTime(assignment.startDate)}
                        </p>
                      )}
                      {effectiveDueDate && (
                        <p className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4" />
                          Entrega: {formatDateTime(effectiveDueDate)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 items-center justify-between">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-primary/20 disabled:text-muted-foreground"
                    onClick={() =>
                      push(`/${Route.Assignment}/${assignment.id}/interview`)
                    }
                    disabled={!canAccess}
                  >
                    Responder Entrevista
                  </Button>

                  {assignment.assignmentAttempts?.length > 0 && (
                    <Button
                      className="w-full bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() =>
                        push(`/${Route.Assignment}/${assignment.id}/attempts`)
                      }
                      disabled={!canAccess}
                    >
                      <CodeSquare className="h-4 w-4 mr-2" />
                      Visualizar Resultados
                    </Button>
                  )}

                  {canViewAnswerKey && (
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-primary/20 disabled:text-muted-foreground"
                      onClick={() =>
                        push(
                          `/${Route.Assignment}/${assignment.id}/${Route.Workspace}/${Route.AnswerKey}`,
                        )
                      }
                      disabled={!canAccess}
                    >
                      <BookOpenCheck className="h-4 w-4 mr-2" />
                      Gabarito
                    </Button>
                  )}

                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-primary/20 disabled:text-muted-foreground"
                    onClick={() => handleTry(assignment.id)}
                    disabled={!canAccess || isProcessing}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    {isProcessing ? "Tarefa em execução..." : "Iniciar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog
        open={selectedDescriptionModal !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDescriptionModal(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {data.find((a) => a.id === selectedDescriptionModal)?.title}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-foreground max-h-96 overflow-y-auto whitespace-pre-wrap">
            {data.find((a) => a.id === selectedDescriptionModal)?.description}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
