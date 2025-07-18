"use client";

import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { Route } from '@/app/routes';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Code } from 'lucide-react';
import { Assignment } from '@/app/interface/scheduler-api/assignment';
import { useAuthUser } from '@/hooks/use-auth-user';

export default function MyAssignmentsCard() {
  const { push } = useRouter();
  const { user } = useAuthUser();

  const { data, isSuccess, isPending } = useQuery({
    queryKey: ['my-assignments', user?.id],
    refetchOnWindowFocus: true,
    initialData: [],
    queryFn: AssignmentService.GetMyAssignments,
  });

  const handleTry = (id: number) => {
    push(`${Route.Assignment}/${id}/${Route.Workspace}`);
  };

  const isUserAbleToTry = (assignment: Assignment) => {
    if ((assignment.suspensions?.length ?? 0) > 0) {
      return assignment.suspensions?.some(suspension => suspension.userId === user?.id) ? false : true;
    }
    return true;
  }

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {isSuccess && data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((assignment) => (
            <Card
              key={assignment.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">
                      {assignment.title}
                    </h3>
                  </div>
                  <p className="text-sm line-clamp-2 mb-4">
                    {assignment.description}
                  </p>

                  {
                    !isUserAbleToTry(assignment) && (
                      <p className="text-red-500 text-sm mb-4">
                        Você não pode iniciar essa tarefa devido a um bloqueio.
                      </p>
                    )
                  }

                  <Button
                    className="w-full"
                    onClick={() => handleTry(assignment.id)}
                    disabled={!isUserAbleToTry(assignment)}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Iniciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold">Nenhuma tarefa encontrada</h2>
          <p className="text-muted-foreground mt-1">
            Voce ainda não possui nenhuma tarefa atribuída.
          </p>
        </div>
      )}
    </>
  );
}
