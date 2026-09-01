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

import {
  ACTIVE_PREVIEW_RUN_STATUSES,
  APPLICATION_FILE_CANDIDATES_BY_WORKER,
  COMPLETED_PREVIEW_RUN_STATUS,
  DEFAULT_APPLICATION_FILE_CANDIDATES,
  FAILED_PREVIEW_RUN_STATUS,
  PREVIEW_RUN_FALLBACK_ERROR,
  PROCESSING_ATTEMPT_STATUSES,
  SCHEDULING_APPLICATION_FILE_PATHS,
  WORKSPACE_STORAGE_KEY_PREFIX,
} from "./constant";

export function createWorkspaceStorageKey(
  kind: "preview-run" | "correction-running",
  userId: number,
  assignmentId: number,
): string {
  return `${WORKSPACE_STORAGE_KEY_PREFIX}-${kind}:${userId}:${assignmentId}`;
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
    (workerType
      ? APPLICATION_FILE_CANDIDATES_BY_WORKER[workerType as WorkerType]
      : undefined
    ) ?? DEFAULT_APPLICATION_FILE_CANDIDATES;

  return candidatePaths.map((path) => files[path]).find(Boolean) ?? "";
}

export function buildSchedulingPayloadFromFileTree(
  assignmentId: number,
  fileTree: FileNode,
): Scheduling {
  const files = flattenFileTreeToSchedulingFiles(fileTree);

  const applicationFileContent = SCHEDULING_APPLICATION_FILE_PATHS
    .map((path) => files[path])
    .find((content) => content !== undefined && content !== null);

  return {
    assignmentId,
    applicationFileContent,
    files,
  };
}

export function mapPreviewRunToResponse(
  previewRun: SchedulingPreviewRun | null | undefined,
): SchedulingResponse | null {
  if (!previewRun || previewRun.status !== COMPLETED_PREVIEW_RUN_STATUS) {
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
  if (!previewRun || previewRun.status !== FAILED_PREVIEW_RUN_STATUS) {
    return null;
  }

  return previewRun.errorMessage ?? PREVIEW_RUN_FALLBACK_ERROR;
}
