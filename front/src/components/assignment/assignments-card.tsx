import { Code, CodeSquare } from "lucide-react";
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

interface AssignmentsCardProps {
  data: Assignment[];
}

const PROCESSING_ATTEMPT_STATUSES = new Set(["pending", "enqueded", "running"]);

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

  const getLastAttemptStatus = (assignment: Assignment) => {
    if (!assignment.assignmentAttempts?.length) {
      return null;
    }
    const lastAttempt = [...assignment.assignmentAttempts].sort(
      (a, b) => b.attempt - a.attempt,
    )[0];
    return lastAttempt?.status;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((assignment) => {
        const lastAttemptStatus = getLastAttemptStatus(assignment);
        const canAccess = canAccessAssignment(assignment);

        const isProcessing = lastAttemptStatus
          ? PROCESSING_ATTEMPT_STATUSES.has(lastAttemptStatus)
          : false;

        return (
          <Card
            key={assignment.id}
            className={cn(
              "overflow-hidden hover:shadow-md transition-shadow",
              {
                "opacity-50": !canAccess,
              },
              {
                "border border-green-600": isProcessing,
              },
              {
                "border border-red-600": lastAttemptStatus === "failed",
              },
              {
                "border border-yellow-600": lastAttemptStatus === "completed",
              },
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between space-x-2 text-white">
                {assignment.title}

                {assignment.score != null && (
                  <Badge className="bg-blue-600 text-white">
                    Vale {assignment.score} pts
                  </Badge>
                )}

                {!canAccess && (
                  <Badge
                    variant={"destructive"}
                    className="bg-red-900 text-red-300"
                  >
                    Tarefa suspensa por quebra de conduta
                  </Badge>
                )}

                {lastAttemptStatus === "failed" && (
                  <Badge className="bg-red-900 text-red-300 animate-pulse">
                    Tentativa com falha
                  </Badge>
                )}

                {isProcessing && (
                  <Badge className="bg-green-600 text-white animate-pulse">
                    Em execução
                  </Badge>
                )}

                {lastAttemptStatus === "completed" && (
                  <Badge className="bg-yellow-600 text-white animate-pulse">
                    Resultados disponíveis
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                  <CardDescription className="text-slate-400 line-clamp-2">
                    {assignment.description}
                  </CardDescription>

                  {shouldShowExpandButton(assignment.description) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 h-auto p-0 w-fit"
                      onClick={() => setSelectedDescriptionModal(assignment.id)}
                    >
                      Ver mais
                    </Button>
                  )}
                </div>

                <div className="flex flex-col space-y-2 items-center justify-between">
                  <Button
                    className="w-full bg-violet-700 hover:bg-violet-800 text-white disabled:bg-slate-700 disabled:text-slate-400"
                    onClick={() =>
                      push(`/${Route.Assignment}/${assignment.id}/interview`)
                    }
                    disabled={!canAccess}
                  >
                    Responder Entrevista
                  </Button>

                  {assignment.assignmentAttempts?.length > 0 && (
                    <Button
                      className="w-full bg-green-700 hover:bg-green-800 text-white"
                      onClick={() =>
                        push(`/${Route.Assignment}/${assignment.id}/attempts`)
                      }
                      disabled={!canAccess}
                    >
                      <CodeSquare className="h-4 w-4 mr-2" />
                      Visualizar Resultados
                    </Button>
                  )}

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-700 disabled:text-slate-400"
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
          <DialogDescription className="text-slate-300 max-h-96 overflow-y-auto whitespace-pre-wrap">
            {data.find((a) => a.id === selectedDescriptionModal)?.description}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
