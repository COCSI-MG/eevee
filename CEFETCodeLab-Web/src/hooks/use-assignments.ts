import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { useQuery } from '@tanstack/react-query';

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
  })
}

export { useAdminAssignments, useFetchAssignment };
