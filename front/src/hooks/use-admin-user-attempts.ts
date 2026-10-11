"use client";

import { AttemptAdminService } from "@/app/integration/scheduler-api/attempt";
import { ADMIN_LIST_PAGE_SIZE } from "@/app/interface/scheduler-api/pagination";
import { useQuery } from "@tanstack/react-query";

interface UseAdminUserAttemptsParams {
  assignmentId?: number;
  userId?: number;
  enabled: boolean;
  page: number;
  pageSize?: number;
}

export function useAdminUserAttempts({
  assignmentId,
  userId,
  enabled,
  page,
  pageSize = ADMIN_LIST_PAGE_SIZE
}: UseAdminUserAttemptsParams) {
  return useQuery({
    queryKey: ["adminUserAttempts", assignmentId, userId, page, pageSize],
    queryFn: () =>
      AttemptAdminService.getAdminAttemptsByAssignmentAndUser(
        assignmentId!,
        userId!,
        { page, pageSize }
      ),
    enabled: enabled && Boolean(assignmentId) && Boolean(userId),
    refetchOnWindowFocus: false,
  });
}
