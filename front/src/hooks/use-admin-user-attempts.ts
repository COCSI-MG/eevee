"use client";

import { AttemptAdminService } from "@/app/integration/scheduler-api/attempt";
import { useQuery } from "@tanstack/react-query";

interface UseAdminUserAttemptsParams {
  assignmentId?: number;
  userId?: number;
  enabled: boolean;
}

export function useAdminUserAttempts({
  assignmentId,
  userId,
  enabled,
}: UseAdminUserAttemptsParams) {
  return useQuery({
    queryKey: ["adminUserAttempts", assignmentId, userId],
    queryFn: () =>
      AttemptAdminService.getAdminAttemptsByAssignmentAndUser(
        assignmentId!,
        userId!,
      ),
    enabled: enabled && Boolean(assignmentId) && Boolean(userId),
    refetchOnWindowFocus: false,
  });
}
