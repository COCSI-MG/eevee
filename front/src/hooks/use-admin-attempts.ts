"use client";

import { AttemptAdminService } from "@/app/integration/scheduler-api/attempt";
import { useQuery } from "@tanstack/react-query";

interface UseAdminAttemptsParams {
  assignmentId?: number;
  classId?: number;
  userSearch?: string;
  page: number;
  pageSize: number;
}

export const useAdminAttempts = ({
  assignmentId,
  classId,
  userSearch,
  page,
  pageSize,
}: UseAdminAttemptsParams) => {
  return useQuery({
    queryKey: ["adminAttempts", classId, assignmentId, userSearch, page, pageSize],
    queryFn: () =>
      AttemptAdminService.getAdminAttempts({
        assignmentId,
        classId,
        userSearch,
        page,
        pageSize,
      }),
    enabled: Boolean(assignmentId || classId),
    refetchOnWindowFocus: false,
  });
};
