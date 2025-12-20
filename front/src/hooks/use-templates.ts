import { TemplatesService } from "@/app/integration/scheduler-api/templates";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { useQuery } from "@tanstack/react-query";

const useTemplates = (workerType?: WorkerType) => {
    const normalizedWorkerType =
        typeof workerType === "string" &&
        Object.values(WorkerType).includes(workerType as WorkerType)
            ? (workerType as WorkerType)
            : undefined;

    return useQuery({
        queryKey: ["templates", normalizedWorkerType],
        retryOnMount: true,
        queryFn: () => TemplatesService.listTemplates(normalizedWorkerType),
    });
};

export { useTemplates };