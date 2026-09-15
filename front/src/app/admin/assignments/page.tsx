"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AssignmentsTable from "@/components/assignment/assignments-table";
import { Route } from "@/app/routes";
import { usePaginatedAssignments } from "@/hooks/use-paginated-assignments";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import Loader from "@/components/loader";
import QueryErrorState from "@/components/shared/query-error-state";
import ListSearch from "@/components/shared/list-search";
import Pagination from "@/components/shared/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useClassOptions } from "@/hooks/use-class-options";
import { useMemo, useState } from "react";

const ALL_CLASSES_VALUE = "all-classes";

export default function AssignmentsAdminPage() {
  const [selectedClassId, setSelectedClassId] = useState("");
  const { page, search, debouncedSearch, setPage, setSearch } =
    usePaginatedSearch({ debounceMs: 3000 });
  const classId = selectedClassId ? Number(selectedClassId) : undefined;

  const {
    data: classes,
    isLoading: isClassesLoading,
    isError: isClassesError
  } = useClassOptions();

  const { data, isFetching, isError, refetch } = usePaginatedAssignments({
    page,
    search: debouncedSearch,
    classId
  });
  const isListLoading = search !== debouncedSearch || isFetching;

  const assignments = data?.data ?? [];
  const meta = data?.meta;

  const assignmentsEmptyMessage = useMemo(() => {
    if (!meta || meta.total === 0) {
      return classId || debouncedSearch.trim()
        ? "Nenhuma atividade corresponde aos filtros."
        : "Nenhuma atividade encontrada.";
    }
    return "Nenhuma atividade encontrada.";
  }, [meta, debouncedSearch, classId]);

  const handleClassChange = (value: string) => {
    setSelectedClassId(value === ALL_CLASSES_VALUE ? "" : value);
    setPage(1);
  };

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

  if (isClassesLoading || (isFetching && !data)) {
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
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="w-full space-y-2 md:max-w-xs">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Filtrar por turma
          </p>
          <Select
            value={selectedClassId || ALL_CLASSES_VALUE}
            onValueChange={handleClassChange}
            disabled={isClassesError}
          >
            <SelectTrigger
              className="border-border bg-background text-foreground"
              aria-label="Filtrar atividades por turma"
            >
              <SelectValue placeholder="Todas as turmas" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value={ALL_CLASSES_VALUE}>
                Todas as turmas
              </SelectItem>
              {(classes ?? []).map((classOption) => (
                <SelectItem
                  key={classOption.id}
                  value={String(classOption.id)}
                >
                  {classOption.name}
                </SelectItem>
              ))}
            </SelectContent>

          </Select>
        </div>

        <ListSearch
          value={search}
          onChange={setSearch}
          placeholder="Filtrar por título ou tipo de worker"
          ariaLabel="Filtrar atividades por título ou tipo de worker"
          className="w-full md:max-w-md"
        />
      </div>

      {isClassesError && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Não foi possível carregar as turmas para o filtro.
        </div>
      )}

      {isListLoading ? (
        <Loader fullScreen={false} />
      ) : (
        <>
          <div className="border rounded-md">
            <AssignmentsTable
              assignments={assignments}
              emptyMessage={assignmentsEmptyMessage}
            />
          </div>

          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              pageSize={meta.pageSize}
              total={meta.total}
              onPageChange={setPage}
              itemLabel={{ singular: "atividade", plural: "atividades" }}
            />
          )}
        </>
      )}
    </div>
  );
}
