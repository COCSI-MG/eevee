"use client";

import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { useQuery } from "@tanstack/react-query";

export function useClassOptions() {
  return useQuery({
    queryKey: ["classOptions"],
    queryFn: ClassesService.listOptions,
    refetchOnWindowFocus: false
  });
}
