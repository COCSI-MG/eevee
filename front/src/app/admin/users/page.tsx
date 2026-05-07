"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import UsersTable from "@/components/users-table";
import { usePaginatedUsers } from "@/hooks/use-paginated-users";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { toast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import Loader from "@/components/loader";
import { UsersService } from "@/app/integration/scheduler-api/user";
import QueryErrorState from "@/components/admin/query-error-state";
import AdminListSearch from "@/components/admin/admin-list-search";
import AdminPagination from "@/components/admin/admin-pagination";
import { useMemo } from "react";

export default function UsersPage() {
  const { page, search, debouncedSearch, setPage, setSearch } =
    usePaginatedSearch();
  const { data, refetch, isFetching, isError } = usePaginatedUsers({
    page,
    search: debouncedSearch,
  });
  const users = data?.data ?? [];
  const meta = data?.meta;

  const usersEmptyMessage = useMemo(() => {
    if (!meta || meta.total === 0) {
      return debouncedSearch.trim() ? "No users match your search." : "No users found.";
    }
    return "No users found.";
  }, [meta, debouncedSearch]);

  const handleDelete = async (id: number) => {
    try {
      await UsersService.deleteUser(id);
      toast({
        title: "User deleted",
        description: "The user has been successfully deleted.",
        duration: 4000,
      });
      refetch();
    } catch (err) {
      console.error("Failed to delete user:", err);

      if (err instanceof AxiosError && err.response) {
        const apiMessage = err.response.data?.message;
        if (apiMessage) {
          toast({
            title: "Error",
            description: apiMessage,
            variant: "destructive",
            duration: 4000,
          });
          return;
        }
      }

      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete user.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <Link href="/admin/users/new">
            <Button variant={"outline"}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </Link>
        </div>

        <QueryErrorState
          title="Não foi possível carregar os usuários"
          description="A listagem de usuários falhou. Tente novamente."
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
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <Link href="/admin/users/new">
          <Button variant={"outline"}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </Link>
      </div>

      <AdminListSearch
        value={search}
        onChange={setSearch}
        placeholder="Filter by name or email"
        ariaLabel="Filter users by name or email"
        className="max-w-md"
      />
      <div className="border rounded-md">
        <UsersTable
          users={users}
          handleDelete={handleDelete}
          emptyMessage={usersEmptyMessage}
        />
      </div>

      {meta && (
        <AdminPagination
          page={meta.page}
          totalPages={meta.totalPages}
          pageSize={meta.pageSize}
          total={meta.total}
          onPageChange={setPage}
          itemLabel={{ singular: "usuário", plural: "usuários" }}
        />
      )}
    </div>
  );
}
