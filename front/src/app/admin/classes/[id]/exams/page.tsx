"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { ExamService } from "@/app/integration/scheduler-api/exam";
import Loader from "@/components/loader";
import QueryErrorState from "@/components/admin/query-error-state";
import AdminListSearch from "@/components/admin/admin-list-search";
import AdminPagination from "@/components/admin/admin-pagination";
import AdminExamsTable from "@/components/exam/admin-exams-table";
import ExamFormDialog from "@/components/exam/exam-form-dialog";
import { usePaginatedExams } from "@/hooks/use-paginated-exams";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { Exam } from "@/app/interface/scheduler-api/exam";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

function ExamsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const classId = Number(id);

  const [initialPage] = useState(() => {
    const p = searchParams.get("page");
    return p ? parseInt(p, 10) : 1;
  });
  const [initialSearch] = useState(() => searchParams.get("search") || "");
  const [sort, setSort] = useState<"asc" | "desc">(
    () => (searchParams.get("sort") as "asc" | "desc") || "asc",
  );

  const { page, search, debouncedSearch, setPage, setSearch } =
    usePaginatedSearch({ initialPage, initialSearch });

  type DialogState =
    | { type: "closed" }
    | { type: "create" }
    | { type: "edit"; exam: Exam };
  const [dialog, setDialog] = useState<DialogState>({ type: "closed" });

  const queryClient = useQueryClient();

  const {
    data: classData,
    isFetching: isClassFetching,
    isError: isClassError,
    refetch: refetchClass,
  } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => ClassesService.getOne(classId),
    enabled: !isNaN(classId),
  });

  const {
    data,
    isFetching: isExamsFetching,
    isError: isExamsError,
    refetch: refetchExams,
  } = usePaginatedExams({
    classId,
    page,
    search: debouncedSearch,
    sort,
  });

  const exams = data?.data ?? [];
  const meta = data?.meta;

  const { mutateAsync: deleteExam } = useMutation({
    mutationFn: ExamService.remove,
    onSuccess: () => {
      toast({
        title: "Prova excluída",
        description: "A prova foi removida com sucesso.",
        duration: 4000,
      });
      queryClient.invalidateQueries({
        queryKey: ["paginatedExams", classId],
      });
    },
    onError: (err: AxiosError) => {
      const res = err.response?.data as { message: string };
      toast({
        title: "Não foi possível excluir a prova",
        description: res?.message || "Tente novamente mais tarde.",
        variant: "destructive",
        duration: 5000,
      });
      throw err;
    },
  });

  const handleDelete = async (id: number) => {
    const shouldGoToPrevPage = exams.length === 1 && page > 1;

    try {
      await deleteExam(id);
      if (shouldGoToPrevPage) {
        setPage(page - 1);
      }
    } catch {
      // Error already shown via onError toast; dialog stays open.
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sort !== "asc") params.set("sort", sort);

    const qs = params.toString();
    const path = `/admin/classes/${id}/exams${qs ? `?${qs}` : ""}`;
    router.replace(path, { scroll: false });
  }, [page, debouncedSearch, sort, id, router]);

  const examsEmptyMessage = useMemo(() => {
    if (!meta || meta.total === 0) {
      return debouncedSearch.trim()
        ? "Sem provas encontradas."
        : "Sem provas para esta turma.";
    }
    return "Sem provas encontradas para esta turma.";
  }, [meta, debouncedSearch]);

  const header = (
    <div className="flex items-center gap-4">
      <Button variant="ghost" onClick={() => router.back()} className="mr-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <h1 className="text-3xl font-bold tracking-tight">
        {isClassFetching
          ? "Provas"
          : `Provas — ${classData?.name ?? "Unknown Class"}`}
      </h1>
    </div>
  );

  if (isNaN(classId)) {
    return (
      <div className="space-y-6">
        {header}
        <QueryErrorState
          title="Invalid class ID"
          description="The provided class identifier is not valid."
          onRetry={() => router.push("/admin/classes")}
          retryLabel="Back to classes"
        />
      </div>
    );
  }

  if (isClassError) {
    return (
      <div className="space-y-6">
        {header}
        <QueryErrorState
          title="Could not load class"
          description="Failed to fetch class information. Try again."
          onRetry={() => {
            void refetchClass();
          }}
          retryLabel="Try again"
          isRetrying={isClassFetching}
        />
      </div>
    );
  }

  if (isExamsError) {
    return (
      <div className="space-y-6">
        {header}
        <AdminListSearch
          value={search}
          onChange={setSearch}
          placeholder="Filtrar por título da prova"
          ariaLabel="Filtrar provas pelo título"
          className="max-w-md"
        />
        <QueryErrorState
          title="Não foi possível carregar as provas"
          description="Falha ao buscar a lista de provas. Tente novamente."
          onRetry={() => {
            void refetchExams();
          }}
          retryLabel="Tentar novamente"
          isRetrying={isExamsFetching}
        />
      </div>
    );
  }

  if (isClassFetching || (isExamsFetching && !data)) {
    return (
      <div className="space-y-6">
        {header}
        <Loader fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="flex items-center justify-between gap-4">
        <AdminListSearch
          value={search}
          onChange={setSearch}
          placeholder="Filtro por título da prova"
          ariaLabel="Filtrar provas pelo título"
          className="max-w-md"
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setDialog({ type: "create" })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova prova
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSort((s) => (s === "asc" ? "desc" : "asc"))
            }
          >
            {sort === "asc" ? (
              <ArrowUp className="h-4 w-4 mr-2" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-2" />
            )}
            Data Vencimento: {sort === "asc" ? "crescente" : "decrescente"}
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <AdminExamsTable
          exams={exams}
          emptyMessage={examsEmptyMessage}
          onEdit={(exam) => setDialog({ type: "edit", exam })}
          onDelete={(exam) => handleDelete(exam.id)}
        />
      </div>

      {meta && (
        <AdminPagination
          page={meta.page}
          totalPages={meta.totalPages}
          pageSize={meta.pageSize}
          total={meta.total}
          onPageChange={setPage}
          itemLabel={{ singular: "prova", plural: "provas" }}
        />
      )}

      <ExamFormDialog
        classId={classId}
        mode={dialog.type === "edit" ? "edit" : "create"}
        exam={dialog.type === "edit" ? dialog.exam : undefined}
        open={dialog.type !== "closed"}
        onOpenChange={(o) => {
          if (!o) setDialog({ type: "closed" });
        }}
      />

    </div>
  );
}

export default function ExamsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Loader fullScreen={false} />
        </div>
      }
    >
      <ExamsPageContent />
    </Suspense>
  );
}
