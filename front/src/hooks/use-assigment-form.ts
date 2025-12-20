import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { toast } from "@/hooks/use-toast";
import { Route } from "@/app/routes";
import { SelectedTemplate } from "@/types/shared";

export const useAssignmentForm = (existingAssignmentId?: number) => {
  const { push } = useRouter();

  const [selectedTemplates, setSelectedTemplates] = useState<
    SelectedTemplate[]
  >([]);

  const { data: existingAssignment, isFetching } = useQuery({
    queryKey: [`currentAssignment ${existingAssignmentId}`],
    queryFn: () =>
      AssignmentService.GetAssignmentById(Number(existingAssignmentId!)),
    enabled: !!existingAssignmentId,
    refetchOnMount: true,
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
      if (!existingAssignmentId) {
        return AssignmentService.CreateAssignment({
          ...newAssignment,
          templates,
        });
      }
      return AssignmentService.UpdateAssignment(existingAssignmentId!, {
        ...newAssignment,
        templates,
      });
    },
    onSuccess: () => {
      toast({
        title: "Assignment saved successfully",
        description: "The assignment has been created/updated successfully.",
      });
      push(Route.AdminAssignments);
    },
    onError: () => {
      toast({
        title: `Error ${
          existingAssignmentId ? "updating" : "creating"
        } assignment`,
        description: "Please try again later.",
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
        ]),
      );

      const templates: SelectedTemplate[] = (existingAssignment.assignmentTemplates ?? [])
        .map((relationOrTemplate: any): SelectedTemplate | null => {
          const template = relationOrTemplate?.template ?? relationOrTemplate;
          const templateIdRaw =
            template?.id ?? relationOrTemplate?.templateId ?? relationOrTemplate?.id;
          const templateId = Number(templateIdRaw);
          if (!Number.isFinite(templateId)) return null;

          const templateParams = template?.templateParams ?? [];

          return {
            templateId,
            params: templateParams.map((param: any) => ({
              templateParamId: Number(param.id),
              value:
                assignmentParamValueByTemplateParamId.get(Number(param.id)) ??
                "",
            })),
          };
        })
        .filter((t): t is SelectedTemplate => t !== null);

      setSelectedTemplates(templates);
    }
  }, [isFetching, existingAssignment]);

  return {
    existingAssignment,
    isFetching,
    selectedTemplates,
    setSelectedTemplates,
    upsertAssignment,
  };
};
