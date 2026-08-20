"use client";

import { ExamService } from "@/app/integration/scheduler-api/exam";
import {
  ADMIN_LIST_PAGE_SIZE,
  PaginatedResponse,
} from "@/app/interface/scheduler-api/pagination";
import { ExamStudentGrades } from "@/app/interface/scheduler-api/exam-student-grades";
import { useQuery } from "@tanstack/react-query";

interface UsePaginatedExamStudentsParams {
  examId: number;
  page: number;
  search?: string;
  pageSize?: number;
}

export const usePaginatedExamStudents = ({
  examId,
  page,
  search,
  pageSize = ADMIN_LIST_PAGE_SIZE,
}: UsePaginatedExamStudentsParams) => {
  return useQuery<PaginatedResponse<ExamStudentGrades>>({
    queryKey: ["examStudents", examId, page, search, pageSize],
    queryFn: () =>
      ExamService.listStudents(examId, {
        page,
        pageSize,
        search: search?.trim() || undefined,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    enabled: Number.isFinite(examId) && examId > 0,
  });
};
