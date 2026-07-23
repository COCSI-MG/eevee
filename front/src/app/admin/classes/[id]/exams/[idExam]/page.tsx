"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFetchExam } from "@/hooks/use-fetch-exam";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { ExamService } from "@/app/integration/scheduler-api/exam";
import Loader from "@/components/loader";
import QueryErrorState from "@/components/shared/query-error-state";
import ListSearch from "@/components/shared/list-search";
import Pagination from "@/components/shared/pagination";
import ExamAssignmentsTable from "@/components/exam/exam-activities-table";
import SelectFromListModal from "@/components/ui/select-from-list-modal";
import { ADMIN_LIST_PAGE_SIZE } from "@/app/interface/scheduler-api/pagination";
import { AssignmentSummary } from "@/app/interface/scheduler-api/exam";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/date";

export default function ExamDetailsPage() {
  const { id, idExam } = useParams<{
    id: string;
    idExam: string;
  }>();
  const router = useRouter();
  const examId = Number(idExam);
  const classId = Number(id);

  const {
    data: examData,
    isFetching,
    isError,
    error,
    refetch,
  } = useFetchExam(examId);
  const exam = examData?.exam;

  const queryClient = useQueryClient();
  const { page, search, debouncedSearch, setPage, setSearch } =
    usePaginatedSearch();

  const { mutateAsync: deleteAssignment } = useMutation({
    mutationFn: AssignmentService.DeleteAssignment,
    onSuccess: () => {
      toast({
        title: "Atividade excluída",
        description: "A atividade foi removida com sucesso.",
        duration: 4000,
      });
      queryClient.invalidateQueries({
        queryKey: ["exam", examId],
      });
    },
    onError: (err: AxiosError) => {
      const res = err.response?.data as { message: string };
      toast({
        title: "Não foi possível excluir a atividade",
        description: res?.message || "Tente novamente mais tarde.",
        variant: "destructive",
        duration: 5000,
      });
      throw err;
    },
  });

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

  const handleDeleteAssignment = (assignment: AssignmentSummary) => {
    void deleteAssignment(assignment.id);
  };

  const { mutateAsync: unlinkAssignmentMutation } = useMutation({
    mutationFn: ({
      examId,
      assignmentId,
    }: {
      examId: number;
      assignmentId: number;
    }) => ExamService.unlinkAssignment(examId, assignmentId),
    onSuccess: () => {
      toast({
        title: "Atividade desvinculada",
        description: "A atividade foi removida desta prova.",
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["exam", examId] });
    },
    onError: (err: AxiosError) => {
      const res = err.response?.data as { message: string };
      toast({
        title: "Não foi possível desvincular a atividade",
        description: res?.message || "Tente novamente mais tarde.",
        variant: "destructive",
        duration: 5000,
      });
      throw err;
    },
  });

  const handleUnlinkAssignment = (assignment: AssignmentSummary) => {
    void unlinkAssignmentMutation({
      examId,
      assignmentId: assignment.id,
    });
  };

  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkPendingId, setLinkPendingId] = useState<number | null>(null);

  const {
    data: linkableAssignments,
    isFetching: isLinkableFetching,
    isError: isLinkableError,
    error: linkableError,
    refetch: refetchLinkable,
  } = useQuery<Assignment[]>({
    queryKey: ["linkable-assignments", classId],
    queryFn: () => AssignmentService.getLinkableByClassId(classId),
    enabled: isLinkOpen && Number.isFinite(classId),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: linkAssignmentMutation } = useMutation({
    mutationFn: ({
      examId,
      assignmentId,
    }: {
      examId: number;
      assignmentId: number;
    }) => ExamService.linkAssignment(examId, assignmentId),
    onSuccess: () => {
      toast({
        title: "Atividade vinculada",
        description: "A atividade foi vinculada à prova com sucesso.",
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["exam", examId] });
      queryClient.invalidateQueries({
        queryKey: ["linkable-assignments", classId],
      });
      setIsLinkOpen(false);
      setLinkPendingId(null);
    },
    onError: (err: AxiosError) => {
      const res = err.response?.data as { message: string };
      toast({
        title: "Não foi possível vincular a atividade",
        description: res?.message || "Tente novamente mais tarde.",
        variant: "destructive",
        duration: 5000,
      });
      setLinkPendingId(null);
      void refetchLinkable();
    },
  });

  const handleLinkAssignment = (assignment: Assignment) => {
    setLinkPendingId(assignment.id);
    void linkAssignmentMutation({
      examId,
      assignmentId: assignment.id,
    });
  };

  const linkableErrorMessage = isLinkableError
    ? linkableError instanceof AxiosError
      ? (
          (linkableError.response?.data as { message?: string })?.message ??
          "Erro ao buscar atividades disponíveis."
        )
      : "Erro ao buscar atividades disponíveis."
    : null;

  if (isNaN(examId) || isNaN(classId)) {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/admin/classes/${classId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a turma
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da prova</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Descrição
            </p>
            <p
              className={cn(
                "mt-1",
                !exam.description && "text-muted-foreground",
              )}
            >
              {exam.description ?? "Sem descrição"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Data de vencimento
            </p>
            <p
              className={cn(
                "mt-1",
                !exam.dueDate && "text-muted-foreground",
              )}
            >
              {formatDateTime(exam.dueDate)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Data de início
            </p>
            <p
              className={cn(
                "mt-1",
                !exam.startDate && "text-muted-foreground",
              )}
            >
              {formatDateTime(exam.startDate)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Atividades</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLinkOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Vincular atividade
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListSearch
            value={search}
            onChange={setSearch}
            placeholder="Filtrar por título da atividade"
            ariaLabel="Filtrar atividades pelo título"
            className="max-w-md"
          />
          <div className="border rounded-md">
            <ExamAssignmentsTable
              assignments={pagedAssignments}
              emptyMessage={assignmentsEmptyMessage}
              onDelete={handleDeleteAssignment}
              onUnlink={handleUnlinkAssignment}
            />
          </div>
          {total > 0 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              total={total}
              onPageChange={setPage}
              itemLabel={{ singular: "atividade", plural: "atividades" }}
            />
          )}
        </CardContent>
      </Card>

      <SelectFromListModal
        open={isLinkOpen}
        onOpenChange={(o) => {
          setIsLinkOpen(o);
          if (!o) setLinkPendingId(null);
        }}
        title="Vincular atividade"
        description="Selecione uma atividade da turma para vincular a esta prova. Atividades já vinculadas a outras provas não são listadas."
        items={linkableAssignments ?? []}
        isLoading={isLinkableFetching}
        errorMessage={linkableErrorMessage}
        emptyMessage="Nenhuma atividade disponível para vincular."
        searchPlaceholder="Filtrar por título da atividade"
        searchKeys={(a) => [a.title, a.description ?? ""]}
        getItemId={(a) => a.id}
        renderRow={(a) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{a.title}</span>
            {a.description && (
              <span className="text-xs text-muted-foreground line-clamp-2">
                {a.description}
              </span>
            )}
          </div>
        )}
        actionLabel="Vincular"
        onSelect={handleLinkAssignment}
        actionPendingId={linkPendingId}
      />
    </div>
  );
}
