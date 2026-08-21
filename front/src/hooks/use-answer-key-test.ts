import { SchedulingService } from "@/app/integration/scheduler-api/scheduling";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { TestTemplateResponse } from "@/app/interface/scheduler-api/template";
import { FileNode } from "@/types/shared";
import { buildSchedulingPayloadFromFileTree } from "@/app/assignment/[id]/workspace/_utils/workspace-scheduling.utils";
import { runWorkspacePreflight } from "@/app/assignment/[id]/workspace/_utils/workspace-preflight.utils";
import { useMutation } from "@tanstack/react-query";

export interface AnswerKeyTestResult extends TestTemplateResponse {
  templateCount: number;
}

interface AnswerKeyTestInput {
  assignment: Assignment;
  fileTree: FileNode;
}

export function useAnswerKeyTest() {
  return useMutation({
    mutationKey: ["answerKeyTest", "preview"],
    mutationFn: async ({ assignment, fileTree }: AnswerKeyTestInput) => {
      const templates = assignment.assignmentTemplates ?? [];

      if (templates.length === 0) {
        throw new Error("A atividade não possui templates para executar.");
      }

      const payload = buildSchedulingPayloadFromFileTree(
        assignment.id,
        fileTree,
      );
      const preflightResult = await runWorkspacePreflight({
        workerType: assignment.workerType,
        files: payload.files,
      });

      if (!preflightResult.ok) {
        throw new Error(
          [
            preflightResult.message,
            ...(preflightResult.details ?? []),
          ]
            .filter(Boolean)
            .join("\n"),
        );
      }

      const result = await SchedulingService.createScheduling(payload);

      return {
        passes: result.passes,
        failures: result.fails,
        completeTrace: result.report,
        templateCount: templates.length,
      } satisfies AnswerKeyTestResult;
    },
  });
}
