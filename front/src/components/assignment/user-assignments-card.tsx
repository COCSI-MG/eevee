"use client";

import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/hooks/use-auth-context';
import AssignmentsCard from './assignments-card';
import Loader from '../loader';
import { Assignment } from '@/app/interface/scheduler-api/assignment';

const PROCESSING_ATTEMPT_STATUSES = new Set(['pending', 'enqueded', 'running']);

const hasAssignmentsProcessingAttempt = (assignments?: Assignment[]) =>
  Boolean(
    assignments?.some((assignment) =>
      assignment.assignmentAttempts?.some((attempt) =>
        PROCESSING_ATTEMPT_STATUSES.has(attempt.status),
      ),
    ),
  );

export default function UserAssignmentsCard() {
  const { user } = useAuthContext();

  const { data, isSuccess, isPending } = useQuery({
    queryKey: ['my-assignments', user?.id],
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      hasAssignmentsProcessingAttempt(query.state.data) ? 5000 : false,
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
