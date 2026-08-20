"use client";

import { AssignmentAttempt } from "@/app/interface/scheduler-api/assignment-attempt";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import {
  Scheduling,
  SchedulingPreviewRun,
  SchedulingPreviewRunStatus,
  SchedulingResponse,
} from "@/app/interface/scheduler-api/scheduling";
import { FileNode } from "@/types/shared";

const PROCESSING_ATTEMPT_STATUSES = new Set(["pending", "enqueded", "running"]);
const ACTIVE_PREVIEW_RUN_STATUSES = new Set<SchedulingPreviewRunStatus>([
  "pending",
  "running",
]);

export function createWorkspaceStorageKey(
  kind: "preview-run" | "correction-running",
  userId: number,
  assignmentId: number,
): string {
  return `workspace-${kind}:${userId}:${assignmentId}`;
}

export function isProcessingAttemptStatus(status: string): boolean {
  return PROCESSING_ATTEMPT_STATUSES.has(status);
}

export function isActivePreviewRunStatus(
  status: SchedulingPreviewRunStatus,
): boolean {
  return ACTIVE_PREVIEW_RUN_STATUSES.has(status);
}

export function getLatestAssignmentAttempt(
  assignmentAttempts: AssignmentAttempt[] | undefined,
): AssignmentAttempt | null {
  if (!assignmentAttempts?.length) {
    return null;
  }

  return [...assignmentAttempts].sort((a, b) => b.attempt - a.attempt)[0];
}

export function flattenFileTreeToSchedulingFiles(
  node: FileNode,
  acc: Record<string, string> = {},
): Record<string, string> {
  if (node.isFile) {
    acc[node.path] = node.content ?? "";
    return acc;
  }

  node.children?.forEach((child) => {
    flattenFileTreeToSchedulingFiles(child, acc);
  });

  return acc;
}

export function getApplicationFileContentForTemplateTest(
  workerType: string | undefined,
  files: Record<string, string>,
): string {
  const candidatePaths =
    workerType === WorkerType.PYTHON_DEFAULT
      ? ["src/app.py", "app.py"]
      : workerType === WorkerType.NODE_REACTJS_CYPRESS
        ? ["src/App.tsx", "src/App.jsx"]
        : workerType === WorkerType.NODE_NEXTJS_CYPRESS
          ? ["src/page.tsx", "src/page.jsx"]
          : ["src/app.ts", "src/app.js", "app.ts", "app.js"];

  return candidatePaths.map((path) => files[path]).find(Boolean) ?? "";
}

export function buildSchedulingPayloadFromFileTree(
  assignmentId: number,
  fileTree: FileNode,
): Scheduling {
  const files = flattenFileTreeToSchedulingFiles(fileTree);

  const applicationFileContent =
    files["app.ts"] ??
    files["src/app.ts"] ??
    files["app.js"] ??
    files["src/app.js"] ??
    files["app.py"] ??
    files["src/app.py"];

  return {
    assignmentId,
    applicationFileContent,
    files,
  };
}

export function mapPreviewRunToResponse(
  previewRun: SchedulingPreviewRun | null | undefined,
): SchedulingResponse | null {
  if (!previewRun || previewRun.status !== "completed") {
    return null;
  }

  return {
    assignmentId: previewRun.assignmentId,
    isAcceptable: Boolean(previewRun.isAcceptable),
    score: Number(previewRun.score ?? 0),
    passes: Number(previewRun.passes ?? 0),
    fails: Number(previewRun.fails ?? 0),
    report: previewRun.report ?? "",
  };
}

export function getPreviewRunError(
  previewRun: SchedulingPreviewRun | null | undefined,
): string | null {
  if (!previewRun || previewRun.status !== "failed") {
    return null;
  }

  return previewRun.errorMessage ?? "Preview failed";
}
