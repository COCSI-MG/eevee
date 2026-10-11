"use client";

import { ClassesService } from "@/app/integration/scheduler-api/classes";
import {
  ADMIN_LIST_PAGE_SIZE,
  PaginatedResponse,
} from "@/app/interface/scheduler-api/pagination";
import {
  Class,
  ClassStatusFilter
} from "@/app/interface/scheduler-api/class";
import { useQuery } from "@tanstack/react-query";

interface UsePaginatedClassesParams {
  page: number;
  search?: string;
  pageSize?: number;
  status?: ClassStatusFilter;
}

export const usePaginatedClasses = ({
  page,
  search,
  pageSize = ADMIN_LIST_PAGE_SIZE,
  status = ClassStatusFilter.Active
}: UsePaginatedClassesParams) => {
  return useQuery<PaginatedResponse<Class>>({
    queryKey: ["paginatedClasses", page, search, pageSize, status],
    queryFn: () =>
      ClassesService.listPaginated({
        page,
        pageSize,
        search: search?.trim() || undefined,
        status
      }),
    placeholderData: (previousData, previousQuery) => previousQuery?.queryKey[4] === status ? previousData : undefined,
    refetchOnWindowFocus: false,
  });
};
