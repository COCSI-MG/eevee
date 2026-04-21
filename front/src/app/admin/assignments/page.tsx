"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AssignmentsTable from "@/components/assignment/assignments-table";
import { Route } from "@/app/routes";
import { useAdminAssignments } from "@/hooks/use-assignments";
import Loader from "@/components/loader";
import QueryErrorState from "@/components/admin/query-error-state";
import AdminListSearch from "@/components/admin/admin-list-search";
import { matchesListSearch } from "@/lib/list-search";
import { useMemo, useState } from "react";

export default function AssignmentsAdminPage() {
  const { data: assignments, isFetching, isError, refetch } =
    useAdminAssignments();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAssignments = useMemo(() => {
    return (assignments ?? []).filter((a) =>
      matchesListSearch(searchQuery, [
        a.title,
        a.class.name,
        a.workerType,
      ])
    );
  }, [assignments, searchQuery]);

  const assignmentsEmptyMessage = useMemo(() => {
    if ((assignments?.length ?? 0) === 0) {
      return "No Assignments found.";
    }
    if (searchQuery.trim() && filteredAssignments.length === 0) {
      return "No assignments match your search.";
    }
    return "No Assignments found.";
  }, [assignments?.length, searchQuery, filteredAssignments.length]);

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>

          <Link href={`/${Route.AdminAssignmentCreate}`}>
            <Button variant={"outline"}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
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

  if (isFetching) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>

        <Link href={`/${Route.AdminAssignmentCreate}`}>
          <Button variant={"outline"}>
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
        </Link>
      </div>
      <AdminListSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Filter by title, class, or worker type"
        ariaLabel="Filter assignments by title, class, or worker type"
        className="max-w-md"
      />
      <div className="border rounded-md">
        <AssignmentsTable
          assignments={filteredAssignments}
          emptyMessage={assignmentsEmptyMessage}
        />
      </div>
    </div>
  );
}
