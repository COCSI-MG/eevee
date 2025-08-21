import { Code, CodeSquare } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useRouter } from "next/navigation";
import { Route } from "@/app/routes";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

interface AssignmentsCardProps {
  data: Assignment[];
}

export default function AssignmentsCard({ data }: AssignmentsCardProps) {
  const { user } = useAuthUser();
  const { push } = useRouter();

  const handleTry = (id: number) => {
    push(`/${Route.Assignment}/${id}/${Route.Workspace}`);
  };

  const isUserSuspendedFromAssignment = (assignment: Assignment) => {
    if ((assignment.suspensions?.length ?? 0) > 0) {
      return assignment.suspensions?.some(
        (suspension) => suspension.userId === user?.id
      )
        ? false
        : true;
    }

    return true;
  };

  const isAssignmentWithRunningAttempt = (assignment: Assignment) => {
    if (assignment.assignmentAttempts?.length) {
      return assignment.assignmentAttempts.some(
        (attempt) => attempt.status === "running"
      );
    }
    return false;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((assignment) => (
        <Card
          key={assignment.id}
          className={cn(
            "overflow-hidden hover:shadow-md transition-shadow",
            {
              "opacity-50": !isUserSuspendedFromAssignment(assignment),
            },
            {
              "border border-green-600":
                assignment.assignmentAttempts?.length > 0 &&
                assignment.assignmentAttempts.some(
                  (attempt) => attempt.status === "running"
                ),
            },
            {
              "border border-red-600":
                (assignment.assignmentAttempts.length > 0 &&
                  assignment.assignmentAttempts.some(
                    (attempt) => attempt.status === "failed"
                  )) ||
                !isUserSuspendedFromAssignment(assignment),
            },
            {
              "border border-yellow-600":
                assignment.assignmentAttempts.length > 0 &&
                assignment.assignmentAttempts.some(
                  (attempt) => attempt.status === "completed"
                ),
            }
          )}
        >
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between space-x-2">
              {assignment.title}

              {!isUserSuspendedFromAssignment(assignment) && (
                <Badge
                  variant={"destructive"}
                  className="bg-red-900 text-red-300"
                >
                  Tarefa suspensa por quebra de conduta
                </Badge>
              )}

              {
                assignment.assignmentAttempts?.length > 0 &&
                assignment.assignmentAttempts.some(
                  (attempt) => attempt.status === "failed")
                && (
                  <Badge className="bg-red-900 text-red-300 animate-pulse">
                    Tentativa com falha
                  </Badge>
                )
              }

              {assignment.assignmentAttempts?.length > 0 &&
                assignment.assignmentAttempts.some(
                  (attempt) => attempt.status === "running"
                ) && (
                  <Badge className="bg-green-600 text-white animate-pulse">
                    Em execução
                  </Badge>
                )}

              {assignment.assignmentAttempts?.length > 0 &&
                assignment.assignmentAttempts.some(
                  (attempt) => attempt.status === "completed"
                ) && (
                  <Badge className="bg-yellow-600 text-white animate-pulse">
                    Resultados disponíveis
                  </Badge>
                )}
            </CardTitle>
            <CardDescription className="text-slate-400 line-clamp-2">
              {assignment.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2 items-center justify-between">
              {assignment.assignmentAttempts?.length > 0 && (
                <Button
                  className="w-full bg-green-700 hover:bg-green-800 text-white mb-2"
                  onClick={() =>
                    push(`/${Route.Assignment}/${assignment.id}/attempts`)
                  }
                  disabled={!isUserSuspendedFromAssignment(assignment)}
                >
                  <CodeSquare className="h-4 w-4 mr-2" />
                  Visualizar Resultados
                </Button>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-700 disabled:text-slate-400"
                onClick={() => handleTry(assignment.id)}
                disabled={
                  !isUserSuspendedFromAssignment(assignment) ||
                  isAssignmentWithRunningAttempt(assignment)
                }
              >
                <Code className="h-4 w-4 mr-2" />
                {isAssignmentWithRunningAttempt(assignment)
                  ? "Tarefa em execução..."
                  : "Iniciar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
