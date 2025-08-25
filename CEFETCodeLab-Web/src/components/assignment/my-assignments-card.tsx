"use client";

import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { useQuery } from '@tanstack/react-query';
import { useAuthUser } from '@/hooks/use-auth-user';
import AssignmentsCard from './assignments-card';
import Loader from '../loader';

export default function MyAssignmentsCard() {
  const { user } = useAuthUser();

  const { data, isSuccess, isPending } = useQuery({
    queryKey: ['my-assignments', user?.id],
    refetchOnWindowFocus: true,
    initialData: [],
    queryFn: AssignmentService.GetMyAssignments,
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <>
      {isSuccess && data.length > 0 ? (
        <AssignmentsCard data={data} />
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
