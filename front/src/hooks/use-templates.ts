import { TemplatesService } from "@/app/integration/scheduler-api/templates";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { useQuery } from "@tanstack/react-query";

const useTemplates = (workerType?: WorkerType, classId?: number) => {
    const normalizedWorkerType =
        typeof workerType === "string" &&
        Object.values(WorkerType).includes(workerType as WorkerType)
            ? (workerType as WorkerType)
            : undefined;

    return useQuery({
        queryKey: ["templates", normalizedWorkerType, classId],
        enabled: Number(classId) > 0,
        retryOnMount: true,
        queryFn: () => TemplatesService.listTemplates(normalizedWorkerType, classId)
    });
};

export { useTemplates };