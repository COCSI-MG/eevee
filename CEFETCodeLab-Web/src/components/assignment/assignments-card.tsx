import { Code } from "lucide-react";
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

interface AssignmentsCardProps {
  data: Assignment[];
}

export default function AssignmentsCard({ data }: AssignmentsCardProps) {
  const { user } = useAuthUser();
  const { push } = useRouter();

  const handleTry = (id: number) => {
    push(`/${Route.Assignment}/${id}/${Route.Workspace}`);
  };

  const isUserAbleToTry = (assignment: Assignment) => {
    if ((assignment.suspensions?.length ?? 0) > 0) {
      return assignment.suspensions?.some(
        (suspension) => suspension.userId === user?.id
      )
        ? false
        : true;
    }
    return true;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((assignment) => (
        <Card
          key={assignment.id}
          className="overflow-hidden hover:shadow-md transition-shadow"
        >
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              {assignment.title}

              {!isUserAbleToTry(assignment) && (
                <Badge
                  variant={"destructive"}
                  className="bg-red-900 text-red-300"
                >
                  Tarefa suspensa por quebra de conduta
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {assignment.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-700 disabled:text-slate-400"
              onClick={() => handleTry(assignment.id)}
              disabled={!isUserAbleToTry(assignment)}
            >
              <Code className="h-4 w-4 mr-2" />
              Iniciar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
