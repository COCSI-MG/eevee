"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import UsersTable from "@/components/users-table";
import { useUsers } from "@/hooks/use-users";
import { toast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import Loader from "@/components/loader";
import { UsersService } from "@/app/integration/scheduler-api/user";
import QueryErrorState from "@/components/admin/query-error-state";
import AdminListSearch from "@/components/admin/admin-list-search";
import { matchesListSearch } from "@/lib/list-search";
import { useMemo, useState } from "react";

export default function UsersPage() {
  const { data: users, refetch, isFetching, isError } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    return (users ?? []).filter((u) =>
      matchesListSearch(searchQuery, [
        u.name,
        u.email,
        u.isAdmin ? "Admin" : "User",
      ])
    );
  }, [users, searchQuery]);

  const usersEmptyMessage = useMemo(() => {
    if ((users?.length ?? 0) === 0) {
      return "No users found.";
    }
    if (searchQuery.trim() && filteredUsers.length === 0) {
      return "No users match your search.";
    }
    return "No users found.";
  }, [users?.length, searchQuery, filteredUsers.length]);

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

  if (isFetching) {
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
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Filter by name, email, or role"
        ariaLabel="Filter users by name, email, or role"
        className="max-w-md"
      />
      <div className="border rounded-md">
        <UsersTable
          users={filteredUsers}
          handleDelete={handleDelete}
          emptyMessage={usersEmptyMessage}
        />
      </div>
    </div>
  );
}
