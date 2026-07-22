"use client";

import { ExamService } from "@/app/integration/scheduler-api/exam";
import { ExamWithActivities } from "@/app/interface/scheduler-api/exam";
import { useQuery } from "@tanstack/react-query";

export const useFetchExam = (id: number) => {
  return useQuery<ExamWithActivities>({
    queryKey: ["exam", id],
    queryFn: () => ExamService.getOne(id),
    enabled: Number.isFinite(id) && id > 0,
    refetchOnWindowFocus: false,
  });
};
