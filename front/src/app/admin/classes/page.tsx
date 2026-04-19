"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { toast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import { useClasses } from "@/hooks/use-classes";
import Loader from "@/components/loader";
import AdminClassesTable from "@/components/classes/admin-classes-table";
import QueryErrorState from "@/components/admin/query-error-state";
import AdminListSearch from "@/components/admin/admin-list-search";
import { matchesListSearch } from "@/lib/list-search";
import { useMemo, useState } from "react";

export default function ClassesPage() {
  const { data: classes, refetch, isFetching, isError } = useClasses();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClasses = useMemo(() => {
    return (classes ?? []).filter((cls) =>
      matchesListSearch(searchQuery, [cls.name, cls.description ?? ""])
    );
  }, [classes, searchQuery]);

  const classesEmptyMessage = useMemo(() => {
    if ((classes?.length ?? 0) === 0) {
      return "No classes found.";
    }
    if (searchQuery.trim() && filteredClasses.length === 0) {
      return "No classes match your search.";
    }
    return "No classes found.";
  }, [classes?.length, searchQuery, filteredClasses.length]);

  const handleDelete = async (id: number) => {
    try {
      await ClassesService.remove(id);
      toast({
        title: "Class deleted",
        description: "The class has been successfully deleted.",
        duration: 4000,
      });
      refetch();
    } catch (err) {
      console.error("Failed to delete class:", err);

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
          err instanceof Error ? err.message : "Failed to delete class.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <Link href="/admin/classes/new">
            <Button variant={"outline"}>
              <Plus className="h-4 w-4 mr-2" />
              Add Class
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

  if (isFetching) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
        <Link href="/admin/classes/new">
          <Button variant={"outline"}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </Link>
      </div>
      <AdminListSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Filter by class name or description"
        ariaLabel="Filter classes by name or description"
        className="max-w-md"
      />
      <div className="border rounded-md">
        <AdminClassesTable
          classes={filteredClasses}
          handleDelete={handleDelete}
          emptyMessage={classesEmptyMessage}
        />
      </div>
    </div>
  );
}
