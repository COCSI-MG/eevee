'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TemplatesTable from "@/components/template/templates-table";
import { useTemplates } from "@/hooks/use-templates";
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
import { matchesListSearch } from "@/lib/list-search";
import { useMemo, useState } from "react";

export default function TemplatePage() {
  const { data: templates, refetch, isFetching, isError } = useTemplates();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = useMemo(() => {
    return (templates ?? []).filter((t) =>
      matchesListSearch(searchQuery, [
        t.title,
        t.description,
        t.workerType,
      ])
    );
  }, [templates, searchQuery]);

  const templatesEmptyMessage = useMemo(() => {
    if ((templates?.length ?? 0) === 0) {
      return undefined;
    }
    if (searchQuery.trim() && filteredTemplates.length === 0) {
      return "No templates match your search.";
    }
    return undefined;
  }, [templates?.length, searchQuery, filteredTemplates.length]);

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

  if (isFetching) {
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
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Filter by title, description, or worker type"
        ariaLabel="Filter templates by title, description, or worker type"
        className="max-w-md"
      />
      <div className="border rounded-md">
        <TemplatesTable
          templates={filteredTemplates}
          handleDelete={handleDelete}
          emptyMessage={templatesEmptyMessage}
        />
      </div>
    </div>
  );
}
