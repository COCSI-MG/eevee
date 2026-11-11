import { WorkerType } from "@/app/interface/scheduler-api/worker";
import type { PreviewStrategy } from "../types";
import { htmlPreviewStrategy } from "./html.strategy";
import { reactPreviewStrategy } from "./react.strategy";

const previewStrategiesByWorkerType = new Map<string, PreviewStrategy>([
  [WorkerType.NODE_REACTJS_CYPRESS, reactPreviewStrategy]
]);

export function resolveWorkerPreviewStrategy(workerType: string): PreviewStrategy {
  return previewStrategiesByWorkerType.get(workerType) ?? htmlPreviewStrategy;
}
