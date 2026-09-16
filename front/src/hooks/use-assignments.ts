import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { useQuery } from '@tanstack/react-query';
import { Assignment } from '@/app/interface/scheduler-api/assignment';
import { isAxiosError } from 'axios';
import { PROCESSING_ATTEMPT_STATUSES } from '@/app/interface/scheduler-api/assignment-attempt';

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
    enabled: Number.isInteger(id) && id > 0,
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? (error.response?.status ?? error.status) : undefined;

      return ![404, 423].includes(status ?? 0) && failureCount < 3;
    },
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      hasProcessingAttempt(query.state.data) ? 5000 : false,
  })
}

export { useAdminAssignments, useFetchAssignment };
