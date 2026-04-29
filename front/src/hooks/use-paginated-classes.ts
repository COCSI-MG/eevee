"use client";

import { ClassesService } from "@/app/integration/scheduler-api/classes";
import {
  ADMIN_LIST_PAGE_SIZE,
  PaginatedResponse,
} from "@/app/interface/scheduler-api/pagination";
import { Class } from "@/app/interface/scheduler-api/class";
import { useQuery } from "@tanstack/react-query";

interface UsePaginatedClassesParams {
  page: number;
  search?: string;
  pageSize?: number;
}

export const usePaginatedClasses = ({
  page,
  search,
  pageSize = ADMIN_LIST_PAGE_SIZE,
}: UsePaginatedClassesParams) => {
  return useQuery<PaginatedResponse<Class>>({
    queryKey: ["paginatedClasses", page, search, pageSize],
    queryFn: () =>
      ClassesService.listPaginated({
        page,
        pageSize,
        search: search?.trim() || undefined,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
};
