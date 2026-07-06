"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AssignmentsTable from "@/components/assignment/assignments-table";
import { Route } from "@/app/routes";
import { usePaginatedAssignments } from "@/hooks/use-paginated-assignments";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import Loader from "@/components/loader";
import QueryErrorState from "@/components/admin/query-error-state";
import AdminListSearch from "@/components/admin/admin-list-search";
import AdminPagination from "@/components/admin/admin-pagination";
import { useMemo } from "react";

export default function AssignmentsAdminPage() {
  const { page, search, debouncedSearch, setPage, setSearch } =
    usePaginatedSearch();
  const { data, isFetching, isError, refetch } = usePaginatedAssignments({
    page,
    search: debouncedSearch,
  });

  const assignments = data?.data ?? [];
  const meta = data?.meta;

  const assignmentsEmptyMessage = useMemo(() => {
    if (!meta || meta.total === 0) {
      return debouncedSearch.trim() ? "Nenhuma atividade corresponde a sua busca." : "Nenhuma atividade encontrada.";
    }
    return "Nenhuma atividade encontrada.";
  }, [meta, debouncedSearch]);

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Atividades</h1>

          <Link href={`/${Route.AdminAssignmentCreate}`}>
            <Button variant={"outline"}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Atividade
            </Button>
          </Link>
        </div>

        <QueryErrorState
          title="Não foi possível carregar os assignments"
          description="A listagem de assignments falhou. Tente novamente."
          onRetry={() => {
            void refetch();
          }}
          retryLabel="Tentar novamente"
          isRetrying={isFetching}
        />
      </div>
    );
  }

  if (isFetching && !data) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Atividades</h1>

        <Link href={`/${Route.AdminAssignmentCreate}`}>
          <Button variant={"outline"}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Atividade
          </Button>
        </Link>
      </div>
      <AdminListSearch
        value={search}
        onChange={setSearch}
        placeholder="Filtrar por título, turma ou tipo de worker"
        ariaLabel="Filtrar atividades por título, turma ou tipo de worker"
        className="max-w-md"
      />
      <div className="border rounded-md">
        <AssignmentsTable
          assignments={assignments}
          emptyMessage={assignmentsEmptyMessage}
        />
      </div>

      {meta && (
        <AdminPagination
          page={meta.page}
          totalPages={meta.totalPages}
          pageSize={meta.pageSize}
          total={meta.total}
          onPageChange={setPage}
          itemLabel={{ singular: "atividade", plural: "atividades" }}
        />
      )}
    </div>
  );
}
