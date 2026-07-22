"use client";

import { ExamService } from "@/app/integration/scheduler-api/exam";
import {
  ADMIN_LIST_PAGE_SIZE,
  PaginatedResponse,
} from "@/app/interface/scheduler-api/pagination";
import { Exam } from "@/app/interface/scheduler-api/exam";
import { useQuery } from "@tanstack/react-query";

interface UsePaginatedExamsParams {
  classId: number;
  page: number;
  search?: string;
  pageSize?: number;
  sort?: "asc" | "desc";
}

export const usePaginatedExams = ({
  classId,
  page,
  search,
  pageSize = ADMIN_LIST_PAGE_SIZE,
  sort = "asc",
}: UsePaginatedExamsParams) => {
  return useQuery<PaginatedResponse<Exam>>({
    queryKey: ["paginatedExams", classId, page, search, pageSize, sort],
    queryFn: () =>
      ExamService.listByClass({
        classId,
        page,
        pageSize,
        search: search?.trim() || undefined,
        sort,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
};
