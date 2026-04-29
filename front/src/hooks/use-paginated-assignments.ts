"use client";

import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import {
  ADMIN_LIST_PAGE_SIZE,
  PaginatedResponse,
} from "@/app/interface/scheduler-api/pagination";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { useQuery } from "@tanstack/react-query";

interface UsePaginatedAssignmentsParams {
  page: number;
  search?: string;
  pageSize?: number;
}

export const usePaginatedAssignments = ({
  page,
  search,
  pageSize = ADMIN_LIST_PAGE_SIZE,
}: UsePaginatedAssignmentsParams) => {
  return useQuery<PaginatedResponse<Assignment>>({
    queryKey: ["paginatedAssignments", page, search, pageSize],
    queryFn: () =>
      AssignmentService.listPaginated({
        page,
        pageSize,
        search: search?.trim() || undefined,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
};
