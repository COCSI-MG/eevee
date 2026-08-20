import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { toast } from "@/hooks/use-toast";
import { Route } from "@/app/routes";
import { SelectedTemplate } from "@/types/shared";
import { TemplateParam } from "@/app/interface/scheduler-api/template";

type UpsertError = { message: string } | null;

export const useAssignmentForm = (existingAssignmentId?: number) => {
  const { push } = useRouter();

  const [selectedTemplates, setSelectedTemplates] = useState<
    SelectedTemplate[] | null
  >([]);
  const [upsertError, setUpsertError] = useState<UpsertError>(null);

  const {
    data: existingAssignment,
    isFetching,
    isError,
    refetch,
    error,
  } = useQuery({
    queryKey: [`currentAssignment ${existingAssignmentId}`],
    queryFn: async () => {
      const assignment = await AssignmentService.GetAssignmentById(
        Number(existingAssignmentId!),
      );

      if (!assignment) {
        throw new Error("Não foi possível carregar o assignment.");
      }

      return assignment;
    },
    enabled: !!existingAssignmentId,
    refetchOnMount: true,
    retryOnMount: true,
  });

  const { mutateAsync: upsertAssignment } = useMutation({
    mutationKey: ["upsertAssignment", existingAssignmentId],
    mutationFn: ({
      newAssignment,
      templates,
    }: {
      newAssignment: Assignment;
      templates: typeof selectedTemplates;
    }) => {
      const serializedTemplates = (templates ?? []).map((t) => ({
        templateId: t.templateId,
        params: t.params,
        ...(t.weight !== undefined ? { weight: t.weight } : {}),
      }));

      if (!existingAssignmentId) {
        return AssignmentService.CreateAssignment({
          ...newAssignment,
          templates: serializedTemplates,
        });
      }
      return AssignmentService.UpdateAssignment(existingAssignmentId!, {
        ...newAssignment,
        templates: serializedTemplates,
      });
    },
    onSuccess: () => {
      setUpsertError(null);
      toast({
        title: "Assignment saved successfully",
        description: "The assignment has been created/updated successfully.",
      });
      push(Route.AdminAssignments);
    },
    onError: (err: Error) => {
      setUpsertError({ message: err.message });
      toast({
        title: `Error ${
          existingAssignmentId ? "updating" : "creating"
        } assignment`,
        description: err.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (
      existingAssignment?.assignmentTemplates &&
      existingAssignment?.assignmentTemplates?.length &&
      !isFetching
    ) {
      const assignmentParamValueByTemplateParamId = new Map(
        (existingAssignment.assignmentParams ?? []).map((p) => [
          p.templateParamsId,
          p.value,
        ])
      );

      const templates: SelectedTemplate[] = (
        existingAssignment.assignmentTemplates ?? []
      )
        .map((relationOrTemplate): SelectedTemplate | null => {
          const template = relationOrTemplate?.template ?? relationOrTemplate;
          const templateIdRaw =
            template?.id ??
            relationOrTemplate?.templateId ??
            relationOrTemplate?.id;
          const templateId = Number(templateIdRaw);
          if (!Number.isFinite(templateId)) return null;

          const templateParams = template?.templateParams ?? [];
          const templateName =
            template?.title ??
            `Template #${templateId}`;

          return {
            templateId,
            name: templateName,
            params: templateParams.map((param: TemplateParam) => ({
              templateParamId: Number(param.id),
              value:
                assignmentParamValueByTemplateParamId.get(Number(param.id)) ??
                "",
            })),
            weight: relationOrTemplate?.weight != null
              ? Number(relationOrTemplate.weight)
              : undefined,
          };
        })
        .filter((t): t is SelectedTemplate => t !== null);

      setSelectedTemplates(templates);
    }
  }, [isFetching, existingAssignment]);

  return {
    existingAssignment,
    isFetching,
    isError,
    refetch,
    error,
    selectedTemplates,
    setSelectedTemplates,
    upsertAssignment,
    upsertError,
    setUpsertError,
  };
};
