"use client";

import { AttemptAdminService } from "@/app/integration/scheduler-api/attempt";
import { useQuery } from "@tanstack/react-query";

interface UseAdminAttemptsParams {
  assignmentId?: number;
  userSearch?: string;
  page: number;
  pageSize: number;
}

export const useAdminAttempts = ({
  assignmentId,
  userSearch,
  page,
  pageSize,
}: UseAdminAttemptsParams) => {
  return useQuery({
    queryKey: ["adminAttempts", assignmentId, userSearch, page, pageSize],
    queryFn: () =>
      AttemptAdminService.getAdminAttempts({
        assignmentId: assignmentId!,
        userSearch,
        page,
        pageSize,
      }),
    enabled: Boolean(assignmentId),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
};
