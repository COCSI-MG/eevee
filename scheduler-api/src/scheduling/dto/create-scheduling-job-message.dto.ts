import { WorkerDefinition } from "src/worker/worker-definition.type";

export class CreateSchedulingJobMessageDto {
    attemptId: number;
    definition: WorkerDefinition;
}