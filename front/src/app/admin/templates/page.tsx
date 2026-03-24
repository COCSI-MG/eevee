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

export default function TemplatePage() {
  const { data: templates, refetch, isFetching } = useTemplates();

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

      <div className="border rounded-md">
        <TemplatesTable templates={templates} handleDelete={handleDelete} />
      </div>
    </div>
  );
}
