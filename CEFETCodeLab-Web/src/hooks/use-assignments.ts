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

export { useAdminAssignments };
