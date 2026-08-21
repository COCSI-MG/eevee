import { TemplatesService } from "@/app/integration/scheduler-api/templates";
import { TestTemplateRequest } from "@/app/interface/scheduler-api/template";
import { useMutation } from "@tanstack/react-query";

export function useTemplateTest() {
  return useMutation({
    mutationKey: ["templateTest", "preview"],
    mutationFn: (body: TestTemplateRequest) =>
      TemplatesService.testTemplatePreview(body),
  });
}
