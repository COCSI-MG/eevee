import { WorkerDefinition } from "src/worker/worker-definition.type";

export class CreateSchedulingJobMessageDto {
    definition: WorkerDefinition;
}