"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Loader2Icon } from "lucide-react";
import { usePaginatedExams } from "@/hooks/use-paginated-exams";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import Loader from "@/components/loader";
import QueryErrorState from "@/components/shared/query-error-state";
import ListSearch from "@/components/shared/list-search";
import Pagination from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import ExamCard from "./exam-card";

export default function ClassesExams() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const {
    data,
    isFetching,
    isError,
    refetch,
  } = usePaginatedExams({
    classId,
    page,
    search: debouncedSearch,
    sort,
  });

  const exams = data?.data ?? [];
  const meta = data?.meta;

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("view", "exams");
    if (page > 1) params.set("page", String(page));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sort !== "asc") params.set("sort", sort);

    const qs = params.toString();
    router.replace(`/classes/${id}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [page, debouncedSearch, sort, id, router]);

  const emptyMessage = useMemo(() => {
    if (!meta || meta.total === 0) {
      return debouncedSearch.trim()
        ? "Nenhuma prova corresponde à busca."
        : "Nenhuma prova disponível para esta turma.";
    }
    return "Nenhuma prova disponível para esta turma.";
  }, [meta, debouncedSearch]);

  if (isError && !data) {
    return (
      <div className="space-y-6">
        <Header onBack={() => router.back()} isRefreshing={false} />
        <ListSearch
          value={search}
          onChange={setSearch}
          placeholder="Filtrar por título da prova"
          ariaLabel="Filtrar provas pelo título"
          className="max-w-md"
        />
        <QueryErrorState
          title="Não foi possível carregar as provas"
          description="Falha ao buscar a lista de provas. Tente novamente."
          onRetry={() => void refetch()}
          retryLabel="Tentar novamente"
          isRetrying={isFetching}
        />
      </div>
    );
  }

  if (isFetching && !data) {
    return (
      <div className="space-y-6">
        <Header onBack={() => router.back()} isRefreshing={false} />
        <Loader fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header onBack={() => router.back()} isRefreshing={isFetching} />

      <div className="flex items-center justify-between gap-4">
        <ListSearch
          value={search}
          onChange={setSearch}
          placeholder="Filtrar por título da prova"
          ariaLabel="Filtrar provas pelo título"
          className="max-w-md"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
        >
          {sort === "asc" ? (
            <ArrowUp className="h-4 w-4 mr-2" />
          ) : (
            <ArrowDown className="h-4 w-4 mr-2" />
          )}
          Data Vencimento: {sort === "asc" ? "crescente" : "decrescente"}
        </Button>
      </div>

      {exams.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} classId={classId} />
          ))}
        </div>
      ) : (
        <p>{emptyMessage}</p>
      )}

      {meta && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          pageSize={meta.pageSize}
          total={meta.total}
          onPageChange={setPage}
          itemLabel={{ singular: "prova", plural: "provas" }}
        />
      )}
    </div>
  );
}

function Header({
  onBack,
  isRefreshing,
}: {
  onBack: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2" />
        Voltar
      </Button>
      <h1 className="text-3xl font-bold tracking-tight">Provas da Turma</h1>
      {isRefreshing && (
        <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
