"use client";

import { SchedulingResponse } from "@/app/interface/scheduler-api/scheduling";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, XCircle } from "lucide-react";
import React from "react";

interface WorkspaceRunPreviewDialogProps {
  open: boolean;
  loading: boolean;
  cancelling?: boolean;
  cancelled?: boolean;
  result: SchedulingResponse | null;
  error: string | null;
  onClose: () => void | Promise<void>;
}

export function WorkspaceRunPreviewDialog({
  open,
  loading,
  cancelling = false,
  cancelled = false,
  result,
  error,
  onClose,
}: WorkspaceRunPreviewDialogProps) {
  const hasResult = Boolean(result);
  const showError = Boolean(error);
  const isBusy = loading || cancelling || cancelled;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        void onClose();
      }
    },
    [onClose],
  );

  const handleClose = React.useCallback(() => {
    void onClose();
  }, [onClose]);

  const scoreValue =
    result && Number.isFinite(result.score)
      ? result.score <= 1
        ? result.score * 100
        : result.score
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-3xl border-slate-700 bg-slate-950 text-slate-100"
        onEscapeKeyDown={(event) => {
          if (isBusy) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (isBusy) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl">Run preview</DialogTitle>
          <DialogDescription className="text-slate-400">
            {cancelling
              ? "Cancelling the preview run."
              : cancelled
                ? "The preview run was cancelled."
              : loading
                ? "Executing tests synchronously. Closing this dialog cancels the active run."
              : hasResult
                ? "The preview finished successfully."
                : showError
                  ? "The preview failed."
                  : "Waiting for preview data."}
          </DialogDescription>
        </DialogHeader>

        {isBusy && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              {cancelled ? (
                <XCircle className="h-4 w-4 text-slate-300" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {cancelling
                ? "Cancelling run..."
                : cancelled
                  ? "Run cancelled."
                  : "Running checks..."}
            </div>
            <p className="text-sm text-slate-400">
              {cancelling
                ? "Waiting for the backend to stop the job."
                : cancelled
                  ? "Returning to the editor."
                : "Press cancel to stop the current run before returning to the editor."}
            </p>
          </div>
        )}

        {!loading && showError && (
          <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <XCircle className="h-4 w-4" />
              Preview failed
            </div>
            <p>{error}</p>
          </div>
        )}

        {!loading && hasResult && result && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                className={
                  result.isAcceptable
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                }
              >
                {result.isAcceptable ? "Accepted" : "Failed"}
              </Badge>
              <span className="text-sm text-slate-400">
                Score {scoreValue.toFixed(0)}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Score
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
                  {result.score}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Passes
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
                  {result.passes}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Fails
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
                  {result.fails}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-200">Report</p>
              <ScrollArea className="h-72 rounded-lg border border-slate-800 bg-slate-900">
                <pre className="whitespace-pre p-4 text-xs leading-5 text-slate-300">
                  {result.report || "No report returned."}
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={cancelling || cancelled}>
            {loading
              ? "Cancel run"
              : cancelling
                ? "Cancelling..."
                : cancelled
                  ? "Cancelled"
                  : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
