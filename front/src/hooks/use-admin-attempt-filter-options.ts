"use client";

import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { useQuery } from "@tanstack/react-query";

export const useAdminAttemptClassOptions = () =>
  useQuery({
    queryKey: ["adminAttemptClassOptions"],
    queryFn: ClassesService.listOptions,
    refetchOnWindowFocus: false,
  });

export const useAdminAttemptAssignmentOptions = (classId?: number) =>
  useQuery({
    queryKey: ["adminAttemptAssignmentOptions", classId],
    queryFn: () => AssignmentService.listOptions(classId),
    refetchOnWindowFocus: false,
  });
