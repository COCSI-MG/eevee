"use client";

import { AttemptAdminService } from "@/app/integration/scheduler-api/attempt";
import { useQuery } from "@tanstack/react-query";

export function useAdminAttemptDetail(attemptId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["adminAttempt", attemptId],
    queryFn: () => AttemptAdminService.getAdminAttemptById(attemptId),
    enabled: enabled && attemptId > 0,
    refetchOnWindowFocus: false,
  });
}
