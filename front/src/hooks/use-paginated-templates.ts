"use client";

import { TemplatesService } from "@/app/integration/scheduler-api/templates";
import {
  ADMIN_LIST_PAGE_SIZE,
  PaginatedResponse,
} from "@/app/interface/scheduler-api/pagination";
import { Template } from "@/app/interface/scheduler-api/template";
import { useQuery } from "@tanstack/react-query";

interface UsePaginatedTemplatesParams {
  page: number;
  search?: string;
  workerType?: string;
  pageSize?: number;
}

export const usePaginatedTemplates = ({
  page,
  search,
  workerType,
  pageSize = ADMIN_LIST_PAGE_SIZE,
}: UsePaginatedTemplatesParams) => {
  return useQuery<PaginatedResponse<Template>>({
    queryKey: ["paginatedTemplates", page, search, workerType, pageSize],
    queryFn: () =>
      TemplatesService.listPaginated({
        page,
        pageSize,
        search: search?.trim() || undefined,
        workerType,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
};
