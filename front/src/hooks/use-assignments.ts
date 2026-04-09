import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { useQuery } from '@tanstack/react-query';
import { Assignment } from '@/app/interface/scheduler-api/assignment';

const PROCESSING_ATTEMPT_STATUSES = new Set(['pending', 'enqueded', 'running']);

const hasProcessingAttempt = (assignment?: Assignment) =>
  Boolean(
    assignment?.assignmentAttempts?.some((attempt) =>
      PROCESSING_ATTEMPT_STATUSES.has(attempt.status),
    ),
  );

const useAdminAssignments = () => {
  return useQuery({
    queryKey: ['adminAssignments'],
    retryOnMount: true,
    initialData: [],
    queryFn: AssignmentService.GetAssignmentsAdmin,
  });
};

const useFetchAssignment = (id: number) => {
  return useQuery({
    queryKey: ['assignment', id],
    queryFn: () => AssignmentService.GetAssignmentById(id),
    enabled: Number.isFinite(id) && id > 0,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      hasProcessingAttempt(query.state.data) ? 5000 : false,
  })
}

export { useAdminAssignments, useFetchAssignment };
