"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { AxiosError } from "axios";
import { useFetchExam } from "@/hooks/use-fetch-exam";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { useExamDetailsData } from "@/hooks/use-exam-details-data";
import { ADMIN_LIST_PAGE_SIZE } from "@/app/interface/scheduler-api/pagination";
import Loader from "@/components/loader";
import QueryErrorState from "@/components/shared/query-error-state";
import ExamDetailsHeader from "@/components/exam/exam-details-header";
import ExamInfoCard from "@/components/exam/exam-info-card";
import ExamActivitiesSection from "@/components/exam/exam-activities-section";
import ExamStudentsSection from "@/components/exam/exam-students-section";
import { Button } from "@/components/ui/button";
import { ExamView } from "@/app/interface/scheduler-api/exam";
import { QueryParam } from "@/types/pagination";

function getViewFromSearch(searchParams: URLSearchParams): ExamView {
  const v = searchParams.get(QueryParam.View);
  return v === ExamView.Students ? ExamView.Students : ExamView.Activities;
}

export default function ExamDetailsPage() {
  const { id, examId } = useParams<{
    id: string;
    examId: string;
  }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examIdNumber = Number(examId);
  const classId = Number(id);
  const currentView = getViewFromSearch(searchParams);

  const setView = (view: ExamView) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(QueryParam.View, view);
    router.replace(`?${params.toString()}`);
  };

  const {
    data: examData,
    isFetching,
    isError,
    error,
    refetch,
  } = useFetchExam(examIdNumber);
  const exam = examData?.exam;

  const { page, search, debouncedSearch,setSearch } =
    usePaginatedSearch();

  const data = useExamDetailsData({ examId: examIdNumber, classId });

  const filteredAssignments = useMemo(() => {
    const all = examData?.assignments ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter((a) => a.title.toLowerCase().includes(q));
  }, [examData?.assignments, debouncedSearch]);

  const total = filteredAssignments.length;
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_LIST_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedAssignments = useMemo(
    () =>
      filteredAssignments.slice(
        (safePage - 1) * ADMIN_LIST_PAGE_SIZE,
        safePage * ADMIN_LIST_PAGE_SIZE,
      ),
    [filteredAssignments, safePage],
  );

  const assignmentsEmptyMessage = useMemo(() => {
    if (total === 0) {
      return debouncedSearch.trim()
        ? "Nenhuma atividade corresponde à busca."
        : "Nenhuma atividade vinculada a esta prova.";
    }
    return "Nenhuma atividade.";
  }, [total, debouncedSearch]);

  if (isNaN(examIdNumber) || isNaN(classId)) {
    return (
      <div className="space-y-6">
        <QueryErrorState
          title="ID inválido"
          description="O identificador da prova ou da turma não é válido."
          onRetry={() => router.push("/admin/classes")}
          retryLabel="Voltar"
          isRetrying={false}
        />
      </div>
    );
  }

  if (
    isError &&
    error instanceof AxiosError &&
    error.response?.status === 404
  ) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href={`/admin/classes/${classId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a turma
          </Link>
        </Button>
        <QueryErrorState
          title="Prova não encontrada"
          description="A prova solicitada não existe ou foi removida."
          onRetry={() => router.push(`/admin/classes/${classId}`)}
          retryLabel="Voltar para a turma"
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <QueryErrorState
          title="Não foi possível carregar a prova"
          description="Ocorreu um erro ao buscar os dados da prova. Tente novamente."
          onRetry={() => {
            void refetch();
          }}
          retryLabel="Tentar novamente"
          isRetrying={isFetching}
        />
      </div>
    );
  }

  if (isFetching && !examData) {
    return <Loader fullScreen={false} />;
  }

  if (!exam) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ExamDetailsHeader
        exam={exam}
        classId={classId}
        currentView={currentView}
        onChangeView={setView}
      />
      <ExamInfoCard exam={exam} />
      {currentView === ExamView.Activities && (
        <ExamActivitiesSection
          pagedAssignments={pagedAssignments}
          total={total}
          totalPages={totalPages}
          safePage={safePage}
          search={search}
          setSearch={setSearch}
          emptyMessage={assignmentsEmptyMessage}
          activitiesData={data.activities}
          editScore={data.editScore}
          link={data.link}
        />
      )}
      {currentView === ExamView.Students && (
        <ExamStudentsSection
          students={data.students}
          retry={data.retry}
          details={data.details}
        />
      )}
    </div>
  );
}
