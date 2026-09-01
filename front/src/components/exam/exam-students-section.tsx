"use client";

import { PaginatedResponse } from "@/app/interface/scheduler-api/pagination";
import { ExamStudentGrades } from "@/app/interface/scheduler-api/exam-student-grades";
import ListSearch from "@/components/shared/list-search";
import Pagination from "@/components/shared/pagination";
import ExamStudentsTable from "@/components/exam/exam-students-table";
import ExamStudentDetailsDialog from "@/components/exam/exam-student-details-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ExamStudentsSectionProps {
  students: {
    data: PaginatedResponse<ExamStudentGrades> | undefined;
    isFetching: boolean;
    isError: boolean;
    error: Error | null;
    page: number;
    search: string;
    debouncedSearch: string;
    setPage: (page: number) => void;
    setSearch: (value: string) => void;
  };
  retry: {
    retryAttempt: (attemptId: number) => void;
    retryingAssignmentId: number | null;
  };
  details: {
    selectedStudent: ExamStudentGrades | null;
    isDetailsOpen: boolean;
    setIsDetailsOpen: (open: boolean) => void;
    expandedAssignmentId: number | null;
    handleViewStudentDetails: (student: ExamStudentGrades) => void;
    handleToggleExpandAssignment: (assignmentId: number) => void;
  };
}

export default function ExamStudentsSection({
  students,
  retry,
  details,
}: ExamStudentsSectionProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Notas dos alunos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListSearch
            value={students.search}
            onChange={students.setSearch}
            placeholder="Filtrar por nome do aluno"
            ariaLabel="Filtrar alunos pelo nome"
            className="max-w-md"
          />
          {students.isError && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                {students.error instanceof Error
                  ? students.error.message
                  : "Erro ao carregar notas dos alunos."}
              </p>
            </div>
          )}
          <div className="border rounded-md">
            <ExamStudentsTable
              students={students.data?.data ?? []}
              emptyMessage={
                students.debouncedSearch.trim()
                  ? "Nenhum aluno corresponde à busca."
                  : "Nenhum aluno matriculado nesta turma."
              }
              onViewDetails={details.handleViewStudentDetails}
            />
          </div>
          {students.data && students.data.meta.total > 0 && (
            <Pagination
              page={students.page}
              totalPages={students.data.meta.totalPages}
              pageSize={students.data.meta.pageSize}
              total={students.data.meta.total}
              onPageChange={students.setPage}
              itemLabel={{ singular: "aluno", plural: "alunos" }}
            />
          )}
        </CardContent>
      </Card>

      <ExamStudentDetailsDialog
        student={details.selectedStudent}
        open={details.isDetailsOpen}
        onOpenChange={details.setIsDetailsOpen}
        onRetry={retry.retryAttempt}
        retryingAssignmentId={retry.retryingAssignmentId}
        expandedAssignmentIds={
          new Set(details.expandedAssignmentId !== null ? [details.expandedAssignmentId] : [])
        }
        onToggleExpand={details.handleToggleExpandAssignment}
      />
    </>
  );
}
