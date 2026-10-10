"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { toast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import { usePaginatedClasses } from "@/hooks/use-paginated-classes";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import Loader from "@/components/loader";
import AdminClassesTable from "@/components/classes/admin-classes-table";
import QueryErrorState from "@/components/shared/query-error-state";
import ListSearch from "@/components/shared/list-search";
import Pagination from "@/components/shared/pagination";
import { useMemo, useState } from "react";
import { useAuthContext } from "@/hooks/use-auth-context";
import { UserRole } from "@/app/interface/scheduler-api/user";
import { ClassStatusFilter } from "@/app/interface/scheduler-api/class";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function ClassesPage() {
  const { user } = useAuthContext();
  const isAdmin = user?.role === UserRole.ADMIN;
  const [classStatus, setClassStatus] = useState<ClassStatusFilter>(ClassStatusFilter.Active);
  const { page, search, debouncedSearch, setPage, setSearch } =
    usePaginatedSearch();
  const { data, refetch, isFetching, isError } = usePaginatedClasses({
    page,
    search: debouncedSearch,
    status: isAdmin ? classStatus : ClassStatusFilter.Active
  });
  const classes = data?.data ?? [];
  const meta = data?.meta;

  const classesEmptyMessage = useMemo(() => {
    if (!meta || meta.total === 0) {
      return debouncedSearch.trim() ? "Nenhuma turma corresponde a sua busca." : "Nenhuma turma encontrada.";
    }
    return "Nenhuma turma encontrada.";
  }, [meta, debouncedSearch]);

  const handleDelete = async (id: number) => {
    try {
      await ClassesService.remove(id);
      toast({
        title: "Turma arquivada",
        description: "A turma foi arquivada e o histórico foi preservado.",
        duration: 4000,
      });
      refetch();
    } catch (err) {
      console.error("Failed to delete class:", err);

      if (err instanceof AxiosError && err.response) {
        const apiMessage = err.response.data?.message;
        if (apiMessage) {
      toast({
        title: "Erro",
        description: apiMessage,
        variant: "destructive",
        duration: 4000,
      });
          return;
        }
      }

      toast({
        title: "Erro",
        description:
          err instanceof Error ? err.message : "Falha ao excluir turma.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await ClassesService.restore(id);
      toast({ title: "Turma restaurada", description: "A turma voltou às listas ativas." });
      refetch();
    } catch (error) {
      const message = error instanceof AxiosError
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;
      toast({
        title: "Erro ao restaurar turma",
        description: message ?? "Não foi possível restaurar a turma.",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Turmas</h1>
          <Link href="/admin/classes/new">
            <Button variant={"outline"}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Turma
            </Button>
          </Link>
        </div>

        <QueryErrorState
          title="Não foi possível carregar as turmas"
          description="A listagem de turmas falhou. Tente novamente."
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
        <h1 className="text-3xl font-bold tracking-tight">Turmas</h1>
        <Link href="/admin/classes/new">
          <Button variant={"outline"}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Turma
          </Button>
        </Link>
      </div>
      <ListSearch
        value={search}
        onChange={setSearch}
        placeholder="Filtrar por nome da turma ou descrição"
        ariaLabel="Filtrar turmas por nome ou descrição"
        className="max-w-md"
      />
      {isAdmin && (
        <div className="w-full space-y-2 md:max-w-xs">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Status das turmas
          </p>

          <Select
            value={classStatus}
            onValueChange={(value) => {
              const selectedStatus = Object.values(ClassStatusFilter).find(
                (status) => status === value,
              );
              if (!selectedStatus) return;
              setClassStatus(selectedStatus);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="border-border bg-background text-foreground"
              aria-label="Filtrar turmas por status"
            >
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value={ClassStatusFilter.Active}>Ativas</SelectItem>
              <SelectItem value={ClassStatusFilter.Inactive}>Inativas</SelectItem>
            </SelectContent>

          </Select>
        </div>
      )}
      <div className="border rounded-md">
        <AdminClassesTable
          classes={classes}
          handleDelete={handleDelete}
          handleRestore={handleRestore}
          emptyMessage={classesEmptyMessage}
        />
      </div>

      {meta && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          pageSize={meta.pageSize}
          total={meta.total}
          onPageChange={setPage}
          itemLabel={{ singular: "turma", plural: "turmas" }}
        />
      )}
    </div>
  );
}
