import { TemplatesService } from "@/app/integration/scheduler-api/templates";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import {
  TestTemplateResponse,
  TemplateParamType,
} from "@/app/interface/scheduler-api/template";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { FileNode } from "@/types/shared";
import {
  flattenFileTreeToSchedulingFiles,
  getApplicationFileContentForTemplateTest,
} from "@/app/assignment/[id]/workspace/_utils/workspace-scheduling.utils";
import { useMutation } from "@tanstack/react-query";

export interface AnswerKeyTestResult extends TestTemplateResponse {
  templateCount: number;
}

interface AnswerKeyTestInput {
  assignment: Assignment;
  fileTree: FileNode;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  return "Erro ao executar o gabarito";
}

export function useAnswerKeyTest() {
  return useMutation({
    mutationKey: ["answerKeyTest", "preview"],
    mutationFn: async ({ assignment, fileTree }: AnswerKeyTestInput) => {
      const templates = assignment.assignmentTemplates ?? [];

      if (templates.length === 0) {
        throw new Error("A atividade não possui templates para executar.");
      }

      const files = flattenFileTreeToSchedulingFiles(fileTree);
      const applicationFileContent = getApplicationFileContentForTemplateTest(
        assignment.workerType,
        files,
      );

      const assignmentParams = new Map(
        (assignment.assignmentParams ?? []).map((param) => [
          param.templateParamsId,
          param.value,
        ]),
      );

      const results: Array<{
        title: string;
        result: TestTemplateResponse;
      }> = [];

      for (const relation of templates) {
        const template = relation.template;

        const paramDefs = (template.templateParams ?? []).map((param) => ({
          name: param.name,
          type: param.type ?? TemplateParamType.STRING,
        }));

        const params = Object.fromEntries(
          (template.templateParams ?? []).map((param) => [
            param.name,
            assignmentParams.get(param.id) ?? "",
          ]),
        );

        try {
          const result = await TemplatesService.testTemplatePreview({
            workerType: assignment.workerType as WorkerType,
            templateContent: template.content,
            applicationFileContent,
            files,
            params,
            paramDefs,
            dependencies: template.dependencies ?? [],
          });

          results.push({
            title: template.title,
            result,
          });
        } catch (error) {
          throw new Error(`Template "${template.title}": ${getErrorMessage(error)}`);
        }
      }

      return {
        passes: results.reduce((total, item) => total + item.result.passes, 0),
        failures: results.reduce(
          (total, item) => total + item.result.failures,
          0,
        ),
        completeTrace: results
          .map(
            ({ title, result }) =>
              `===== ${title} =====\n${result.completeTrace || "(sem saída)"}`,
          )
          .join("\n\n"),
        templateCount: results.length,
      } satisfies AnswerKeyTestResult;
    },
  });
}
