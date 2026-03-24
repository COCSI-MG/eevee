import { WorkerDefinition } from "./types/worker-definition.type.js";

const WORKER_DEFINITION_B64_ENV_NAME = "WORKER_DEFINITION_B64";

export async function loadWorkerDefinition(): Promise<WorkerDefinition> {
  const encodedDefinition = process.env[WORKER_DEFINITION_B64_ENV_NAME];

  if (!encodedDefinition) {
    throw new Error(
      `Missing environment variable: ${WORKER_DEFINITION_B64_ENV_NAME}`
    );
  }

  const input = Buffer.from(encodedDefinition, "base64").toString("utf-8");
  if (!input) {
    throw new Error("Worker definition payload is empty");
  }

  return JSON.parse(input);
}