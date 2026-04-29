'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TemplatesTable from "@/components/template/templates-table";
import { usePaginatedTemplates } from "@/hooks/use-paginated-templates";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { toast } from "@/hooks/use-toast";
import { AxiosError } from "axios";
import Loader from "@/components/loader";
import { TemplatesService } from "@/app/integration/scheduler-api/templates";
import {
  TEMPLATE_LIST_TEXT,
  TEMPLATE_LIST_TOAST_MESSAGES,
} from "@/app/admin/templates/constants";
import QueryErrorState from "@/components/admin/query-error-state";
import AdminListSearch from "@/components/admin/admin-list-search";
import AdminPagination from "@/components/admin/admin-pagination";
import { useMemo } from "react";

export default function TemplatePage() {
  const { page, search, debouncedSearch, setPage, setSearch } =
    usePaginatedSearch();
  const { data, refetch, isFetching, isError } = usePaginatedTemplates({
    page,
    search: debouncedSearch,
  });
  const templates = data?.data ?? [];
  const meta = data?.meta;

  const templatesEmptyMessage = useMemo(() => {
    if (!meta || meta.total === 0) {
      return debouncedSearch.trim() ? "No templates match your search." : undefined;
    }
    return undefined;
  }, [meta, debouncedSearch]);

  const handleDelete = async (id: number) => {
    try {
      await TemplatesService.deleteTemplate(id);
      toast({
        title: TEMPLATE_LIST_TOAST_MESSAGES.deleteSuccessTitle,
        description: TEMPLATE_LIST_TOAST_MESSAGES.deleteSuccessDescription,
        duration: 4000,
      });
      refetch();
    } catch (err) {
      console.error("Failed to delete template:", err);

      if (err instanceof AxiosError && err.response) {
        const apiMessage = err.response.data?.message;
        if (apiMessage) {
          toast({
            title: TEMPLATE_LIST_TOAST_MESSAGES.errorTitle,
            description: apiMessage,
            variant: "destructive",
            duration: 4000,
          });
          return;
        }
      }

      toast({
        title: TEMPLATE_LIST_TOAST_MESSAGES.errorTitle,
        description:
          err instanceof Error
            ? err.message
            : TEMPLATE_LIST_TOAST_MESSAGES.deleteErrorFallbackDescription,
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {TEMPLATE_LIST_TEXT.title}
          </h1>
          <Link href="/admin/templates/new">
            <Button variant={"outline"}>
              <Plus className="h-4 w-4 mr-2" />
              {TEMPLATE_LIST_TEXT.addButton}
            </Button>
          </Link>
        </div>

        <QueryErrorState
          title="Não foi possível carregar os templates"
          description="A listagem de templates falhou. Tente novamente."
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
        <h1 className="text-3xl font-bold tracking-tight">
          {TEMPLATE_LIST_TEXT.title}
        </h1>
        <Link href="/admin/templates/new">
          <Button variant={"outline"}>
            <Plus className="h-4 w-4 mr-2" />
            {TEMPLATE_LIST_TEXT.addButton}
          </Button>
        </Link>
      </div>

      <AdminListSearch
        value={search}
        onChange={setSearch}
        placeholder="Filter by title, description, or worker type"
        ariaLabel="Filter templates by title, description, or worker type"
        className="max-w-md"
      />
      <div className="border rounded-md">
        <TemplatesTable
          templates={templates}
          handleDelete={handleDelete}
          emptyMessage={templatesEmptyMessage}
        />
      </div>

      {meta && (
        <AdminPagination
          page={meta.page}
          totalPages={meta.totalPages}
          pageSize={meta.pageSize}
          total={meta.total}
          onPageChange={setPage}
          itemLabel={{ singular: "template", plural: "templates" }}
        />
      )}
    </div>
  );
}
