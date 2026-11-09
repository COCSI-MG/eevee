"use client";

import { AssignmentService } from "@/app/integration/platform-api/assignment";
import { useQuery } from "@tanstack/react-query";

export function useAdminAttemptAssignmentOptions(classId?: number) {
  return useQuery({
    queryKey: ["adminAttemptAssignmentOptions", classId],
    queryFn: () => AssignmentService.listOptions(classId),
    refetchOnWindowFocus: false
  });
}
